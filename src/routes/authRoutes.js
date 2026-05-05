const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyOTP, toggle2FA, resendOTP, amILogin } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.get('/is-logged-in', protect, amILogin);
router.put('/toggle-2fa', protect, toggle2FA);

module.exports = router;
