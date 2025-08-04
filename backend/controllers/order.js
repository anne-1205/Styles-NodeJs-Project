const connection = require('../config/database');
const sendEmail = require('../utils/sendEmail')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const generateOrderPDF = require('../utils/generateOrderPDF');

exports.createOrder = (req, res, next) => {
    console.log('Order received:', req.body); // DEBUG LOG
    const { cart, user } = req.body;
    const dateOrdered = new Date();
    const dateShipped = new Date();

    connection.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Transaction error', details: err });

        // Insert into orderinfo with user_id
        const orderInfoSql = `
  INSERT INTO orderinfo 
    (user_id, date_placed, date_shipped, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_phone, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
        connection.execute(orderInfoSql, [
  user.id,
  dateOrdered,
  dateShipped,
  req.body.shipping_address,
  req.body.shipping_city,
  req.body.shipping_state,
  req.body.shipping_zip,
  req.body.shipping_phone,
  req.body.notes
], (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    if (!res.headersSent) res.status(500).json({ error: 'Error inserting orderinfo', details: err });
                });
            }

            const order_id = result.insertId;

            // Insert each cart item into orderline
            const orderLineSql = 'INSERT INTO orderline (orderinfo_id, item_id, quantity) VALUES (?, ?, ?)';
            let errorOccurred = false;
            let completed = 0;

            if (cart.length === 0) {
                return connection.rollback(() => {
                    if (!res.headersSent) res.status(400).json({ error: 'Cart is empty' });
                });
            }

            cart.forEach((item, idx) => {
                connection.execute(orderLineSql, [order_id, item.item_id, item.quantity], (err) => {
                    if (err && !errorOccurred) {
                        errorOccurred = true;
                        return connection.rollback(() => {
                            if (!res.headersSent) res.status(500).json({ error: 'Error inserting orderline', details: err });
                        });
                    }
                    completed++;
                    if (completed === cart.length && !errorOccurred) {
                        connection.commit(err => {
                            if (err) {
                                return connection.rollback(() => {
                                    if (!res.headersSent) res.status(500).json({ error: 'Commit error', details: err });
                                });
                            }
                            if (!res.headersSent) {
                                res.status(201).json({
                                    success: true,
                                    order_id,
                                    dateOrdered,
                                    message: 'transaction complete',
                                    cart
                                });
                            }
                        });
                    }
                });
            });
        });
    });
}

exports.getMyOrders = (req, res) => {
    const userId = req.user.id;
    const sql = `
        SELECT o.orderinfo_id, o.date_placed, o.status as order_status, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_phone, ol.item_id, ol.quantity, i.description, i.product_image, i.sell_price
        FROM orderinfo o
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        WHERE o.user_id = ?
        ORDER BY o.date_placed DESC
    `;
    connection.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        // Group by order
        const orders = [];
        const orderMap = {};
        results.forEach(row => {
            if (!orderMap[row.orderinfo_id]) {
                orderMap[row.orderinfo_id] = {
                    orderinfo_id: row.orderinfo_id,
                    date_placed: row.date_placed,
                    status: row.order_status,
                    shipping_address: row.shipping_address,
                    shipping_city: row.shipping_city,
                    shipping_state: row.shipping_state,
                    shipping_zip: row.shipping_zip,
                    shipping_phone: row.shipping_phone,
                    items: []
                };
                orders.push(orderMap[row.orderinfo_id]);
            }
            orderMap[row.orderinfo_id].items.push({
                item_id: row.item_id,
                quantity: row.quantity,
                description: row.description,
                product_image: row.product_image,
                sell_price: row.sell_price
            });
        });
        res.json({ orders });
    });
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'shipped', 'delivered'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Only pending, shipped, and delivered are allowed.' });
    }
    
    const sql = 'UPDATE orderinfo SET status = ? WHERE orderinfo_id = ?';
    connection.execute(sql, [status, id], async (err) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        
        // Fetch order details after update
        const orderSql = `SELECT o.orderinfo_id, o.date_placed, o.status, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_phone,
                         u.name as user_name, u.email as user_email, i.description, ol.quantity, i.sell_price
                         FROM orderinfo o
                         JOIN users u ON o.user_id = u.id
                         JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                         JOIN item i ON ol.item_id = i.item_id
                         WHERE o.orderinfo_id = ?`;
        
        connection.query(orderSql, [id], async (err2, rows) => {
            if (err2 || !rows || rows.length === 0) return res.json({ success: true });
            
            // Group order details
            const order = {
                orderinfo_id: rows[0].orderinfo_id,
                date_placed: rows[0].date_placed,
                status: rows[0].status,
                shipping_address: rows[0].shipping_address,
                shipping_city: rows[0].shipping_city,
                shipping_state: rows[0].shipping_state,
                shipping_zip: rows[0].shipping_zip,
                shipping_phone: rows[0].shipping_phone,
                user_name: rows[0].user_name,
                user_email: rows[0].user_email,
                items: rows.map(r => ({ description: r.description, quantity: r.quantity, sell_price: r.sell_price })),
                total: rows.reduce((sum, r) => sum + r.quantity * r.sell_price, 0)
            };
            
            // Send email notifications for different status updates
            try {
                let emailSubject = '';
                let emailMessage = '';
                let attachments = [];
                
                switch(status) {
                    case 'shipped':
                        emailSubject = 'Your Order Has Been Shipped';
                        emailMessage = `
                            <h2>Order Update</h2>
                            <p>Hello ${order.user_name},</p>
                            <p>Great news! Your order #${order.orderinfo_id} has been shipped and is on its way to you.</p>
                            <p>You can track your order status in your account dashboard.</p>
                            <p>Thank you for choosing STYLES!</p>
                        `;
                        break;
                        
                    case 'delivered':
                        emailSubject = 'Your Order Has Been Delivered';
                        emailMessage = `
                            <h2>Order Delivered!</h2>
                            <p>Hello ${order.user_name},</p>
                            <p>Your order #${order.orderinfo_id} has been successfully delivered!</p>
                            <p>We hope you love your new items. Please find your receipt attached.</p>
                            <p>We'd love to hear about your experience! You can now leave reviews for the items you purchased.</p>
                            <p>Visit your order history to leave reviews and help other customers make informed decisions.</p>
                            <p>Thank you for choosing STYLES!</p>
                        `;
                        
                        // Generate enhanced PDF receipt
                        const pdfPath = `./receipts/order_${order.orderinfo_id}.pdf`;
                        if (!fs.existsSync('./receipts')) fs.mkdirSync('./receipts');
                        
                        await new Promise((resolve, reject) => {
                            const stream = fs.createWriteStream(pdfPath);
                            generateOrderPDF(order, stream);
                            stream.on('finish', resolve);
                            stream.on('error', reject);
                        });
                        
                        attachments = [{
                            filename: `Order_${order.orderinfo_id}_Receipt.pdf`,
                            path: pdfPath
                        }];
                        break;
                }
                
                // Send email with appropriate content
                if (emailSubject && emailMessage) {
                    await sendEmail({
                        email: order.user_email,
                        subject: emailSubject,
                        message: emailMessage,
                        attachments: attachments
                    });
                    
                    // Clean up PDF file after sending
                    if (attachments.length > 0 && fs.existsSync(attachments[0].path)) {
                        fs.unlinkSync(attachments[0].path);
                    }
                }
                
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Don't fail the request if email fails
            }
            
            res.json({ success: true, message: `Order status updated to ${status}` });
        });
    });
};

exports.getAllOrders = (req, res) => {
    const sql = `
        SELECT o.orderinfo_id, o.date_placed, o.status as order_status, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_phone,
               u.id as user_id, u.name as user_name, u.email as user_email,
               ol.item_id, ol.quantity, i.description, i.product_image, i.sell_price
        FROM orderinfo o
        JOIN users u ON o.user_id = u.id
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        ORDER BY o.date_placed DESC
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        // Group by order
        const orders = [];
        const orderMap = {};
        results.forEach(row => {
            if (!orderMap[row.orderinfo_id]) {
                orderMap[row.orderinfo_id] = {
                    orderinfo_id: row.orderinfo_id,
                    date_placed: row.date_placed,
                    status: row.order_status,
                    shipping_address: row.shipping_address,
                    shipping_city: row.shipping_city,
                    shipping_state: row.shipping_state,
                    shipping_zip: row.shipping_zip,
                    shipping_phone: row.shipping_phone,
                    user_id: row.user_id,
                    user_name: row.user_name,
                    user_email: row.user_email,
                    items: []
                };
                orders.push(orderMap[row.orderinfo_id]);
            }
            orderMap[row.orderinfo_id].items.push({
                item_id: row.item_id,
                quantity: row.quantity,
                description: row.description,
                product_image: row.product_image,
                sell_price: row.sell_price
            });
        });
        res.json({ orders });
    });
};

// Sales by Month (Bar Chart)
exports.getSalesByMonth = (req, res) => {
    const sql = `
        SELECT DATE_FORMAT(o.date_placed, '%Y-%m') as month, SUM(ol.quantity * i.sell_price) as total_sales
        FROM orderinfo o
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        WHERE o.status = 'delivered'
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ sales: results });
    });
};

// Sales Trend (Line Chart, by day for last 30 days)
exports.getSalesTrend = (req, res) => {
    const sql = `
        SELECT DATE(o.date_placed) as day, SUM(ol.quantity * i.sell_price) as total_sales
        FROM orderinfo o
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        WHERE o.status = 'delivered' AND o.date_placed >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY day
        ORDER BY day ASC
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ sales: results });
    });
};

// Sales by Category (Pie Chart)
exports.getSalesByCategory = (req, res) => {
    const sql = `
        SELECT i.category, SUM(ol.quantity * i.sell_price) as total_sales
        FROM orderinfo o
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        WHERE o.status = 'delivered'
        GROUP BY i.category
        ORDER BY total_sales DESC
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ sales: results });
    });
};

// Top Selling Products (by quantity)
exports.getTopProducts = (req, res) => {
    const sql = `
        SELECT i.description, SUM(ol.quantity) as total_quantity
        FROM orderinfo o
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        WHERE o.status = 'delivered'
        GROUP BY i.description
        ORDER BY total_quantity DESC
        LIMIT 10
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ products: results });
    });
};

// Sales by User (top 10 by total spent)
exports.getSalesByUser = (req, res) => {
    const sql = `
        SELECT u.name, SUM(ol.quantity * i.sell_price) as total_spent
        FROM orderinfo o
        JOIN users u ON o.user_id = u.id
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        WHERE o.status = 'delivered'
        GROUP BY u.name
        ORDER BY total_spent DESC
        LIMIT 10
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ users: results });
    });
};

// Order Status Distribution
exports.getOrderStatusDistribution = (req, res) => {
    const sql = `
        SELECT status, COUNT(*) as count
        FROM orderinfo
        GROUP BY status
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ status: results });
    });
};

// Average Order Value Over Time (by month)
exports.getAvgOrderValue = (req, res) => {
    const sql = `
        SELECT DATE_FORMAT(o.date_placed, '%Y-%m') as month, AVG(order_total) as avg_order_value
        FROM (
            SELECT o.orderinfo_id, o.date_placed, SUM(ol.quantity * i.sell_price) as order_total
            FROM orderinfo o
            JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
            JOIN item i ON ol.item_id = i.item_id
            WHERE o.status = 'delivered'
            GROUP BY o.orderinfo_id
        ) as orders
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ avg: results });
    });
};

// Recent Orders (last 10)
exports.getRecentOrders = (req, res) => {
    const sql = `
        SELECT o.date_placed, u.name, SUM(ol.quantity * i.sell_price) as total, o.status
        FROM orderinfo o
        JOIN users u ON o.user_id = u.id
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        GROUP BY o.orderinfo_id
        ORDER BY o.date_placed DESC
        LIMIT 10
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ orders: results });
    });
};

// Sales Heatmap (by day of week)
exports.getSalesHeatmap = (req, res) => {
    const sql = `
        SELECT DAYNAME(o.date_placed) as day, SUM(ol.quantity * i.sell_price) as total_sales
        FROM orderinfo o
        JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
        JOIN item i ON ol.item_id = i.item_id
        WHERE o.status = 'delivered'
        GROUP BY day
        ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        res.json({ heatmap: results });
    });
};

exports.downloadOrderReceipt = (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id; // Get current user ID from token
    
    if (!orderId || isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    // Fetch order details and verify ownership
    const orderSql = `SELECT o.orderinfo_id, o.date_placed, o.status, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_phone, u.name as user_name, u.email as user_email, i.description, ol.quantity, i.sell_price, i.product_image
                      FROM orderinfo o
                      JOIN users u ON o.user_id = u.id
                      JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                      JOIN item i ON ol.item_id = i.item_id
                      WHERE o.orderinfo_id = ? AND o.user_id = ?`;
    
    connection.query(orderSql, [orderId, userId], (err, rows) => {
        if (err) {
            console.error('Database error in downloadOrderReceipt:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Order not found or access denied' });
        }
        
        try {
            const order = {
                orderinfo_id: rows[0].orderinfo_id,
                date_placed: rows[0].date_placed,
                status: rows[0].status,
                user_name: rows[0].user_name,
                user_email: rows[0].user_email,
                shipping_address: rows[0].shipping_address,
                shipping_city: rows[0].shipping_city,
                shipping_state: rows[0].shipping_state,
                shipping_zip: rows[0].shipping_zip,
                shipping_phone: rows[0].shipping_phone,
                items: rows.map(r => ({ 
                    description: r.description, 
                    quantity: r.quantity, 
                    sell_price: r.sell_price, 
                    product_image: r.product_image 
                })),
                total: rows.reduce((sum, r) => sum + (r.quantity * r.sell_price), 0)
            };
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Order_${order.orderinfo_id}_Receipt.pdf`);
            generateOrderPDF(order, res);
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    });
};

// Admin version - can download any order's PDF
exports.downloadOrderReceiptAdmin = (req, res) => {
    const { orderId } = req.params;
    
    if (!orderId || isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    // Fetch order details (no user ownership check for admin)
    const orderSql = `SELECT o.orderinfo_id, o.date_placed, o.status, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_phone, u.name as user_name, u.email as user_email, i.description, ol.quantity, i.sell_price, i.product_image
                      FROM orderinfo o
                      JOIN users u ON o.user_id = u.id
                      JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                      JOIN item i ON ol.item_id = i.item_id
                      WHERE o.orderinfo_id = ?`;
    
    connection.query(orderSql, [orderId], (err, rows) => {
        if (err) {
            console.error('Database error in downloadOrderReceiptAdmin:', err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        try {
            const order = {
                orderinfo_id: rows[0].orderinfo_id,
                date_placed: rows[0].date_placed,
                status: rows[0].status,
                user_name: rows[0].user_name,
                user_email: rows[0].user_email,
                shipping_address: rows[0].shipping_address,
                shipping_city: rows[0].shipping_city,
                shipping_state: rows[0].shipping_state,
                shipping_zip: rows[0].shipping_zip,
                shipping_phone: rows[0].shipping_phone,
                items: rows.map(r => ({ 
                    description: r.description, 
                    quantity: r.quantity, 
                    sell_price: r.sell_price, 
                    product_image: r.product_image 
                })),
                total: rows.reduce((sum, r) => sum + (r.quantity * r.sell_price), 0)
            };
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Order_${order.orderinfo_id}_Receipt.pdf`);
            generateOrderPDF(order, res);
        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    });
};