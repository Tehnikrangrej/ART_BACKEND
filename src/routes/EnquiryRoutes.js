const express = require('express');
const router = express.Router();

const {
  createEnquiry,
  getMyEnquiries,
  getAllEnquiries,
  getAllPendingEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  assignEnquiry,
} = require('../controllers/EnquiryController');

const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles, requireVerified } = require('../middlewares/roleMiddleware');

// ─── CLIENT / CLIENT_REPRESENTATIVE ──────────────────────────────────────────
router.post('/',
  protect,
  requireVerified,
  authorizeRoles('CLIENT', 'CLIENT_REPRESENTATIVE'),
  createEnquiry
);

router.get('/my',
  protect,
  requireVerified,
  authorizeRoles('CLIENT', 'CLIENT_REPRESENTATIVE'),
  getMyEnquiries
);

// ─── SUPERADMIN ───────────────────────────────────────────────────────────────
router.get('/pending',
  protect,
  authorizeRoles('SUPERADMIN'),
  getAllPendingEnquiries
);

router.put('/:id/assign',
  protect,
  authorizeRoles('SUPERADMIN'),
  assignEnquiry
);

// ─── SUPERADMIN / ADMIN ───────────────────────────────────────────────────────
router.get('/',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  getAllEnquiries
);

router.get('/:id',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN', 'CLIENT', 'CLIENT_REPRESENTATIVE'),
  getEnquiryById
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────
router.put('/:id/status',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  updateEnquiryStatus
);

module.exports = router;
