const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

const { registerUser, loginUser, updateUser, deactivateUser, verifyEmail, updateUserRole, updateUserStatus } = require('../controllers/user');
const { isAuthenticatedUser } = require('../middlewares/auth');

router.post('/register', upload.single('image'), registerUser);
router.post('/login', loginUser);
router.post('/update-profile', isAuthenticatedUser, upload.single('image'), updateUser);
router.delete('/deactivate', isAuthenticatedUser, deactivateUser);
router.get('/verify-email', verifyEmail);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.get('/users', require('../controllers/user').getAllUsers);

module.exports = router;