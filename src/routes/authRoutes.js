const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyOTP, toggle2FA, resendOTP, amILogin, getAllUsers } = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/is-logged-in', protect, amILogin);
router.put('/toggle-2fa', protect, toggle2FA);
router.get('/users', protect, admin, getAllUsers);

module.exports = router;

