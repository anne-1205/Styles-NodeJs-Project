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
    const sql = 'UPDATE orderinfo SET status = ? WHERE orderinfo_id = ?';
    connection.execute(sql, [status, id], async (err) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        // Fetch order details after update
        const orderSql = `SELECT o.orderinfo_id, o.date_placed, o.status, u.name as user_name, u.email as user_email, i.description, ol.quantity, i.sell_price
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
                user_name: rows[0].user_name,
                user_email: rows[0].user_email,
                items: rows.map(r => ({ description: r.description, quantity: r.quantity, sell_price: r.sell_price })),
                total: rows.reduce((sum, r) => sum + r.quantity * r.sell_price, 0)
            };
            // Only send email and PDF if status is delivered
            if (status === 'delivered') {
                // Generate PDF
                const pdfPath = `./receipts/order_${order.orderinfo_id}.pdf`;
                if (!fs.existsSync('./receipts')) fs.mkdirSync('./receipts');
                await new Promise((resolve, reject) => {
                    const doc = new PDFDocument();
                    const stream = fs.createWriteStream(pdfPath);
                    doc.pipe(stream);
                    doc.fontSize(20).text('Order Receipt', { align: 'center' });
                    doc.moveDown();
                    doc.fontSize(14).text(`Order ID: ${order.orderinfo_id}`);
                    doc.text(`Customer: ${order.user_name}`);
                    doc.text(`Status: ${order.status}`);
                    doc.text(`Date: ${order.date_placed}`);
                    doc.moveDown();
                    doc.text('Items:');
                    order.items.forEach(item => {
                        doc.text(`- ${item.description} x${item.quantity} @ ₱${item.sell_price}`);
                    });
                    doc.moveDown();
                    doc.text(`Total: ₱${order.total}`);
                    doc.end();
                    stream.on('finish', resolve);
                    stream.on('error', reject);
                });
                // Send email with PDF
                await sendEmail({
                    email: order.user_email,
                    subject: 'Your Order Receipt',
                    message: `Thank you for your order! Please find your receipt attached.`,
                    attachments: [{
                        filename: `Order_${order.orderinfo_id}_Receipt.pdf`,
                        path: pdfPath
                    }]
                });
                // Optionally delete the PDF after sending
                fs.unlinkSync(pdfPath);
            }
            res.json({ success: true });
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
    // Fetch order details
    const orderSql = `SELECT o.orderinfo_id, o.date_placed, o.status, o.shipping_address, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_phone, u.name as user_name, u.email as user_email, i.description, ol.quantity, i.sell_price, i.product_image
                      FROM orderinfo o
                      JOIN users u ON o.user_id = u.id
                      JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                      JOIN item i ON ol.item_id = i.item_id
                      WHERE o.orderinfo_id = ?`;
    connection.query(orderSql, [orderId], (err, rows) => {
        if (err || !rows || rows.length === 0) return res.status(404).send('Order not found');
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
            items: rows.map(r => ({ description: r.description, quantity: r.quantity, sell_price: r.sell_price, product_image: r.product_image })),
            total: rows.reduce((sum, r) => sum + r.quantity * r.sell_price, 0)
        };
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Order_${order.orderinfo_id}_Receipt.pdf`);
        generateOrderPDF(order, res);
    });
};