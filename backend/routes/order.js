const express = require('express');

const router = express.Router();

const {createOrder, getMyOrders, updateOrderStatus, getSalesByMonth, getSalesTrend, getSalesByCategory, downloadOrderReceipt, downloadOrderReceiptAdmin} = require('../controllers/order')
const {isAuthenticatedUser, isAdmin} = require('../middlewares/auth')

router.post('/create-order', isAuthenticatedUser, createOrder)
router.get('/my-orders', isAuthenticatedUser, getMyOrders);
router.put('/orders/:id/status', isAuthenticatedUser, isAdmin, updateOrderStatus);
router.get('/orders', isAuthenticatedUser, isAdmin, require('../controllers/order').getAllOrders);
router.get('/sales/month', isAuthenticatedUser, isAdmin, getSalesByMonth);
router.get('/sales/trend', isAuthenticatedUser, isAdmin, getSalesTrend);
router.get('/sales/category', isAuthenticatedUser, isAdmin, getSalesByCategory);
router.get('/sales/top-products', isAuthenticatedUser, isAdmin, require('../controllers/order').getTopProducts);
router.get('/sales/by-user', isAuthenticatedUser, isAdmin, require('../controllers/order').getSalesByUser);
router.get('/sales/status', isAuthenticatedUser, isAdmin, require('../controllers/order').getOrderStatusDistribution);
router.get('/sales/avg-order-value', isAuthenticatedUser, isAdmin, require('../controllers/order').getAvgOrderValue);
router.get('/sales/recent-orders', isAuthenticatedUser, isAdmin, require('../controllers/order').getRecentOrders);
router.get('/sales/heatmap', isAuthenticatedUser, isAdmin, require('../controllers/order').getSalesHeatmap);
router.get('/order/:orderId/receipt', isAuthenticatedUser, downloadOrderReceipt);
router.get('/admin/order/:orderId/receipt', isAuthenticatedUser, isAdmin, downloadOrderReceiptAdmin);

module.exports = router;