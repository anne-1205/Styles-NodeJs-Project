const connection = require('../config/database');

// 1. Sales by Month
exports.salesByMonth = (req, res) => {
    const sql = `SELECT DATE_FORMAT(o.date_placed, '%Y-%m') as month, SUM(ol.quantity * i.sell_price) as total_sales
                 FROM orderinfo o
                 JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                 JOIN item i ON ol.item_id = i.item_id
                 WHERE o.status = 'delivered'
                 GROUP BY month
                 ORDER BY month`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ sales: rows });
    });
};

// 2. Sales Trend (last 30 days)
exports.salesTrend = (req, res) => {
    const sql = `SELECT DATE(o.date_placed) as day, SUM(ol.quantity * i.sell_price) as total_sales
                 FROM orderinfo o
                 JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                 JOIN item i ON ol.item_id = i.item_id
                 WHERE o.status = 'delivered' AND o.date_placed >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                 GROUP BY day
                 ORDER BY day`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ sales: rows });
    });
};

// 3. Sales by Category
exports.salesByCategory = (req, res) => {
    const sql = `SELECT i.category, SUM(ol.quantity * i.sell_price) as total_sales
                 FROM orderinfo o
                 JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                 JOIN item i ON ol.item_id = i.item_id
                 WHERE o.status = 'delivered'
                 GROUP BY i.category`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ sales: rows });
    });
};

// 4. Top Selling Products
exports.topProducts = (req, res) => {
    const sql = `SELECT i.description, SUM(ol.quantity) as total_quantity
                 FROM orderinfo o
                 JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                 JOIN item i ON ol.item_id = i.item_id
                 WHERE o.status = 'delivered'
                 GROUP BY i.description
                 ORDER BY total_quantity DESC
                 LIMIT 10`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ products: rows });
    });
};

// 5. Sales by User
exports.salesByUser = (req, res) => {
    const sql = `SELECT u.name, SUM(ol.quantity * i.sell_price) as total_spent
                 FROM orderinfo o
                 JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                 JOIN item i ON ol.item_id = i.item_id
                 JOIN users u ON o.user_id = u.id
                 WHERE o.status = 'delivered'
                 GROUP BY u.name
                 ORDER BY total_spent DESC`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users: rows });
    });
};

// 6. Order Status Distribution
exports.orderStatus = (req, res) => {
    const sql = `SELECT o.status, COUNT(*) as count
                 FROM orderinfo o
                 GROUP BY o.status`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: rows });
    });
};

// 7. Average Order Value Over Time (by month)
exports.avgOrderValue = (req, res) => {
    const sql = `SELECT DATE_FORMAT(o.date_placed, '%Y-%m') as month, AVG(order_total) as avg_order_value
                 FROM (
                   SELECT o.orderinfo_id, SUM(ol.quantity * i.sell_price) as order_total, o.date_placed
                   FROM orderinfo o
                   JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                   JOIN item i ON ol.item_id = i.item_id
                   WHERE o.status = 'delivered'
                   GROUP BY o.orderinfo_id
                 ) as sub
                 GROUP BY month
                 ORDER BY month`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ avg: rows });
    });
};

// 8. Recent Orders Table
exports.recentOrders = (req, res) => {
    const sql = `SELECT o.date_placed, u.name, SUM(ol.quantity * i.sell_price) as total, o.status
                 FROM orderinfo o
                 JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                 JOIN item i ON ol.item_id = i.item_id
                 JOIN users u ON o.user_id = u.id
                 GROUP BY o.orderinfo_id
                 ORDER BY o.date_placed DESC
                 LIMIT 10`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ orders: rows });
    });
};

// 9. Sales Heatmap (by day of week)
exports.salesHeatmap = (req, res) => {
    const sql = `SELECT DAYNAME(o.date_placed) as day, SUM(ol.quantity * i.sell_price) as total_sales
                 FROM orderinfo o
                 JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id
                 JOIN item i ON ol.item_id = i.item_id
                 WHERE o.status = 'delivered'
                 GROUP BY day`;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ heatmap: rows });
    });
};
