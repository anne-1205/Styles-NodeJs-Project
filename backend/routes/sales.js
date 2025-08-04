const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.get('/month', isAuthenticatedUser, isAdmin, salesController.salesByMonth);
router.get('/trend', isAuthenticatedUser, isAdmin, salesController.salesTrend);
router.get('/category', isAuthenticatedUser, isAdmin, salesController.salesByCategory);
router.get('/top-products', isAuthenticatedUser, isAdmin, salesController.topProducts);
router.get('/by-user', isAuthenticatedUser, isAdmin, salesController.salesByUser);
router.get('/status', isAuthenticatedUser, isAdmin, salesController.orderStatus);
router.get('/avg-order-value', isAuthenticatedUser, isAdmin, salesController.avgOrderValue);
router.get('/recent-orders', isAuthenticatedUser, isAdmin, salesController.recentOrders);
router.get('/heatmap', isAuthenticatedUser, isAdmin, salesController.salesHeatmap);

module.exports = router; 