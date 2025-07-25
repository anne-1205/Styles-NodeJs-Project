const connection = require('../config/database');

exports.addressChart = (req, res) => {
    const sql = 'SELECT count(addressline) as total, addressline FROM customer GROUP BY addressline ORDER BY total DESC';
    try {
        connection.query(sql, (err, rows, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }
            return res.status(200).json({
                rows,
            })
        });
    } catch (error) {
        console.log(error)
    }


};

exports.salesChart = (req, res) => {
    const sql = 'SELECT monthname(oi.date_placed) as month, sum(ol.quantity * i.sell_price) as total FROM orderinfo oi INNER JOIN orderline ol ON oi.orderinfo_id = ol.orderinfo_id INNER JOIN item i ON i.item_id = ol.item_id GROUP BY month(oi.date_placed)';
    try {
        connection.query(sql, (err, rows, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }
            return res.status(200).json({
                rows,
            })
        });
    } catch (error) {
        console.log(error)
    }


};

exports.itemsChart = (req, res) => {
    const sql = 'SELECT i.description as items, sum(ol.quantity) as total FROM item i INNER JOIN orderline ol ON i.item_id = ol.item_id GROUP BY i.description';
    try {
        connection.query(sql, (err, rows, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }
            return res.status(200).json({
                rows,
            })
        });
    } catch (error) {
        console.log(error)
    }


};

exports.getAdminStats = (req, res) => {
    const stats = {};
    // Total Sales (delivered only)
    const salesSql = `SELECT SUM(ol.quantity * i.sell_price) as total_sales FROM orderinfo o JOIN orderline ol ON o.orderinfo_id = ol.orderinfo_id JOIN item i ON ol.item_id = i.item_id WHERE o.status = 'delivered'`;
    // Total Orders (delivered only)
    const ordersSql = `SELECT COUNT(*) as total_orders FROM orderinfo WHERE status = 'delivered'`;
    // Total Customers (all users)
    const customersSql = `SELECT COUNT(*) as total_customers FROM users`;
    // Total Products (all items)
    const productsSql = `SELECT COUNT(*) as total_products FROM item`;

    let done = 0;
    const checkDone = () => { if (++done === 4) res.json(stats); };

    connection.query(salesSql, (err, rows) => {
        stats.total_sales = rows && rows[0] ? rows[0].total_sales || 0 : 0;
        checkDone();
    });
    connection.query(ordersSql, (err, rows) => {
        stats.total_orders = rows && rows[0] ? rows[0].total_orders || 0 : 0;
        checkDone();
    });
    connection.query(customersSql, (err, rows) => {
        stats.total_customers = rows && rows[0] ? rows[0].total_customers || 0 : 0;
        checkDone();
    });
    connection.query(productsSql, (err, rows) => {
        stats.total_products = rows && rows[0] ? rows[0].total_products || 0 : 0;
        checkDone();
    });
};