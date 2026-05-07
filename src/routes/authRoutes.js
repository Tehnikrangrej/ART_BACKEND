const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  toggle2FA,
  getMe,
  getAllUsers,
  createAdmin,
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/register',    registerUser);
router.post('/login',       loginUser);
router.post('/verify-otp',  verifyOTP);
router.post('/resend-otp',  resendOTP);

// ─── Authenticated ────────────────────────────────────────────────────────────
router.get('/me',           protect, getMe);
router.get('/is-logged-in', protect, getMe);
router.put('/toggle-2fa',   protect, toggle2FA);

// ─── SUPERADMIN only ──────────────────────────────────────────────────────────
router.post('/create-admin',
  protect,
  authorizeRoles('SUPERADMIN'),
  createAdmin
);

router.get('/users',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  getAllUsers
);

module.exports = router;
