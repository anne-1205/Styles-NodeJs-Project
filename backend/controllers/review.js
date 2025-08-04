const connection = require('../config/database');

// Create a new review
exports.createReview = (req, res) => {
    const { item_id, order_id, rating, comment } = req.body;
    const user_id = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ 
            success: false, 
            message: 'Rating must be between 1 and 5' 
        });
    }

    // Check if order is delivered
    const orderCheckSql = 'SELECT status FROM orderinfo WHERE orderinfo_id = ? AND user_id = ?';
    connection.execute(orderCheckSql, [order_id, user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error', 
                error: err 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        if (results[0].status !== 'delivered') {
            return res.status(400).json({ 
                success: false, 
                message: 'You can only review delivered orders' 
            });
        }

        // Check if review already exists
        const checkSql = 'SELECT id FROM reviews WHERE user_id = ? AND item_id = ? AND order_id = ?';
        connection.execute(checkSql, [user_id, item_id, order_id], (err2, results2) => {
            if (err2) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error', 
                    error: err2 
                });
            }

            if (results2.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'You have already reviewed this item from this order' 
                });
            }

            // Create review
            const insertSql = 'INSERT INTO reviews (user_id, item_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)';
            connection.execute(insertSql, [user_id, item_id, order_id, rating, comment], (err3, result) => {
                if (err3) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error creating review', 
                        error: err3 
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: 'Review created successfully',
                    review_id: result.insertId
                });
            });
        });
    });
};

// Get reviews for a specific item
exports.getItemReviews = (req, res) => {
    const { item_id } = req.params;

    const sql = `
        SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
               u.name as user_name, u.profile_picture
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.item_id = ?
        ORDER BY r.created_at DESC
    `;

    connection.execute(sql, [item_id], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error', 
                error: err 
            });
        }

        // Calculate average rating
        const avgRating = results.length > 0 
            ? (results.reduce((sum, review) => sum + review.rating, 0) / results.length).toFixed(1)
            : 0;

        return res.status(200).json({
            success: true,
            reviews: results,
            average_rating: parseFloat(avgRating),
            total_reviews: results.length
        });
    });
};

// Update a review
exports.updateReview = (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ 
            success: false, 
            message: 'Rating must be between 1 and 5' 
        });
    }

    // Check if review exists and belongs to user
    const checkSql = 'SELECT id FROM reviews WHERE id = ? AND user_id = ?';
    connection.execute(checkSql, [id, user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error', 
                error: err 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found or you do not have permission to edit it' 
            });
        }

        // Update review
        const updateSql = 'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?';
        connection.execute(updateSql, [rating, comment, id], (err2, result) => {
            if (err2) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error updating review', 
                    error: err2 
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Review updated successfully'
            });
        });
    });
};

// Delete a review (user can only delete their own reviews)
exports.deleteReview = (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if review exists and belongs to user
    const checkSql = 'SELECT id FROM reviews WHERE id = ? AND user_id = ?';
    connection.execute(checkSql, [id, user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error', 
                error: err 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found or you do not have permission to delete it' 
            });
        }

        // Delete review
        const deleteSql = 'DELETE FROM reviews WHERE id = ?';
        connection.execute(deleteSql, [id], (err2, result) => {
            if (err2) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error deleting review', 
                    error: err2 
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Review deleted successfully'
            });
        });
    });
};

// Get all reviews (admin only)
exports.getAllReviews = (req, res) => {
    const sql = `
        SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
               u.name as user_name, u.email as user_email,
               i.description as item_name, i.product_image,
               o.orderinfo_id
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN item i ON r.item_id = i.item_id
        JOIN orderinfo o ON r.order_id = o.orderinfo_id
        ORDER BY r.created_at DESC
    `;

    connection.execute(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error', 
                error: err 
            });
        }

        return res.status(200).json({
            success: true,
            reviews: results
        });
    });
};

// Delete review (admin only)
exports.adminDeleteReview = (req, res) => {
    const { id } = req.params;

    const deleteSql = 'DELETE FROM reviews WHERE id = ?';
    connection.execute(deleteSql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting review', 
                error: err 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    });
};

// Get user's reviews
exports.getUserReviews = (req, res) => {
    const user_id = req.user.id;

    const sql = `
        SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
               i.description as item_name, i.product_image, i.item_id,
               o.orderinfo_id
        FROM reviews r
        JOIN item i ON r.item_id = i.item_id
        JOIN orderinfo o ON r.order_id = o.orderinfo_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    `;

    connection.execute(sql, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error', 
                error: err 
            });
        }

        return res.status(200).json({
            success: true,
            reviews: results
        });
    });
}; 