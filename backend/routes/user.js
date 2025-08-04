const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

const { registerUser, loginUser, updateUser, deactivateUser, verifyEmail, updateUserRole, updateUserStatus, logoutUser } = require('../controllers/user');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.post('/register', upload.single('image'), registerUser);
router.post('/login', loginUser);
router.post('/logout', isAuthenticatedUser, logoutUser);
router.post('/update-profile', isAuthenticatedUser, upload.single('image'), updateUser);
router.delete('/deactivate', isAuthenticatedUser, deactivateUser);
router.get('/verify-email', verifyEmail);
router.put('/users/:id/role', isAuthenticatedUser, isAdmin, updateUserRole);
router.put('/users/:id/status', isAuthenticatedUser, isAdmin, updateUserStatus);
router.get('/users', isAuthenticatedUser, isAdmin, require('../controllers/user').getAllUsers);

module.exports = router;