const express = require('express');

const router = express.Router();


const {addressChart, salesChart, itemsChart, getAdminStats} = require('../controllers/dashboard')
const {isAuthenticatedUser} = require('../middlewares/auth')
router.get('/address-chart', isAuthenticatedUser, addressChart)
router.get('/sales-chart', isAuthenticatedUser, salesChart)
router.get('/items-chart', isAuthenticatedUser, itemsChart)
router.get('/stats', isAuthenticatedUser, getAdminStats)

module.exports = router;




