const connection = require('../config/database');
const multer = require('multer');
const upload = multer({ dest: 'images/' }); // or your preferred config

exports.getAllItems = (req, res) => {
    const sql = 'SELECT * FROM item';
    try {
        connection.query(sql, (err, rows, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }
            console.log(rows);
            return res.status(200).json({
                rows,
            })
        });
    } catch (error) {
        console.log(error)
    }
}

exports.getSingleItem = (req, res) => {
    const sql = 'SELECT * FROM item WHERE item_id = ?';
    const values = [parseInt(req.params.id)];
    try {
        connection.execute(sql, values, (err, result, fields) => {
            if (err instanceof Error) {
                console.log(err);
                return;
            }
            return res.status(200).json({
                success: true,
                result
            })
        });
    } catch (error) {
        console.log(error)
    }
}

exports.createItem = (req, res) => {
    console.log(req.file ,req.body)
    const { description, category, cost_price, sell_price, quantity } = req.body;
    let imagePath = null;
    if (req.file) {
        imagePath = req.file.filename; // Only the filename, not the path
    }
    if (!description || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const sql = 'INSERT INTO item (description, category, cost_price, sell_price, quantity, product_image) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [description, category, cost_price, sell_price, quantity, imagePath];
    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error inserting item', details: err });
        }
        return res.status(201).json({
            success: true,
            itemId: result.insertId,
            image: imagePath,
            quantity
        });
    });
}

exports.updateItem = (req, res) => {
    console.log(req.file)
    const id = req.params.id
    const { description, category, cost_price, sell_price, quantity } = req.body;
    let imagePath = null;
    if (req.file) {
        imagePath = req.file.filename; // Only the filename, not the path
    }
    if (!description || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const sql = 'UPDATE item SET description = ?, category = ?, cost_price = ?, sell_price = ?, quantity = ?, product_image = ? WHERE item_id = ?';
    const values = [description, category, cost_price, sell_price, quantity, imagePath, id];
    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error updating item', details: err });
        }
        return res.status(200).json({ success: true });
    });
}

exports.deleteItem = (req, res) => {
    const id = req.params.id
    const sql = 'DELETE FROM item WHERE item_id = ?';
    const values = [id];
    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error deleting item', details: err });
        }
        return res.status(201).json({
            success: true,
            message: 'item deleted'
        });
    });
}

