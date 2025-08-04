const express = require('express');
const router = express.Router();
const { 
    createReview, 
    getItemReviews, 
    updateReview, 
    deleteReview, 
    getAllReviews, 
    adminDeleteReview,
    getUserReviews 
} = require('../controllers/review');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/items/:item_id/reviews', getItemReviews);

// User routes (authenticated)
router.post('/reviews', isAuthenticatedUser, createReview);
router.put('/reviews/:id', isAuthenticatedUser, updateReview);
router.delete('/reviews/:id', isAuthenticatedUser, deleteReview);
router.get('/user/reviews', isAuthenticatedUser, getUserReviews);

// Admin routes
router.get('/admin/reviews', isAuthenticatedUser, isAdmin, getAllReviews);
router.delete('/admin/reviews/:id', isAuthenticatedUser, isAdmin, adminDeleteReview);

module.exports = router; 