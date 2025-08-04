const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')


const { getAllItems,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem
} = require('../controllers/item')

const {isAuthenticatedUser, isAdmin} = require('../middlewares/auth')

router.get('/items', getAllItems)
router.get('/items/:id', getSingleItem)
router.post('/items', isAuthenticatedUser, isAdmin, upload.single('product_image'), createItem)
router.put('/items/:id', isAuthenticatedUser, isAdmin, upload.single('product_image'), updateItem)
router.delete('/items/:id', isAuthenticatedUser, isAdmin, deleteItem)
module.exports = router;
