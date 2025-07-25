const express = require('express');

const router = express.Router();

const {createOrder, getMyOrders, updateOrderStatus, getSalesByMonth, getSalesTrend, getSalesByCategory, downloadOrderReceipt} = require('../controllers/order')
const {isAuthenticatedUser} = require('../middlewares/auth')

router.post('/create-order', isAuthenticatedUser, createOrder)
router.get('/my-orders', isAuthenticatedUser, getMyOrders);
router.put('/orders/:id/status', isAuthenticatedUser, updateOrderStatus);
router.get('/orders', isAuthenticatedUser, require('../controllers/order').getAllOrders);
router.get('/sales/month', isAuthenticatedUser, getSalesByMonth);
router.get('/sales/trend', isAuthenticatedUser, getSalesTrend);
router.get('/sales/category', isAuthenticatedUser, getSalesByCategory);
router.get('/sales/top-products', isAuthenticatedUser, require('../controllers/order').getTopProducts);
router.get('/sales/by-user', isAuthenticatedUser, require('../controllers/order').getSalesByUser);
router.get('/sales/status', isAuthenticatedUser, require('../controllers/order').getOrderStatusDistribution);
router.get('/sales/avg-order-value', isAuthenticatedUser, require('../controllers/order').getAvgOrderValue);
router.get('/sales/recent-orders', isAuthenticatedUser, require('../controllers/order').getRecentOrders);
router.get('/sales/heatmap', isAuthenticatedUser, require('../controllers/order').getSalesHeatmap);
router.get('/order/:orderId/receipt', downloadOrderReceipt);

module.exports = router;