const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales');
const { isAuthenticatedUser } = require('../middlewares/auth');

router.get('/month', isAuthenticatedUser, salesController.salesByMonth);
router.get('/trend', isAuthenticatedUser, salesController.salesTrend);
router.get('/category', isAuthenticatedUser, salesController.salesByCategory);
router.get('/top-products', isAuthenticatedUser, salesController.topProducts);
router.get('/by-user', isAuthenticatedUser, salesController.salesByUser);
router.get('/status', isAuthenticatedUser, salesController.orderStatus);
router.get('/avg-order-value', isAuthenticatedUser, salesController.avgOrderValue);
router.get('/recent-orders', isAuthenticatedUser, salesController.recentOrders);
router.get('/heatmap', isAuthenticatedUser, salesController.salesHeatmap);

module.exports = router; 