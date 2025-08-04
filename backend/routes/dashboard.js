const express = require('express');

const router = express.Router();


const {addressChart, salesChart, itemsChart, getAdminStats} = require('../controllers/dashboard')
const {isAuthenticatedUser, isAdmin} = require('../middlewares/auth')
router.get('/address-chart', isAuthenticatedUser, isAdmin, addressChart)
router.get('/sales-chart', isAuthenticatedUser, isAdmin, salesChart)
router.get('/items-chart', isAuthenticatedUser, isAdmin, itemsChart)
router.get('/stats', isAuthenticatedUser, isAdmin, getAdminStats)

module.exports = router;




