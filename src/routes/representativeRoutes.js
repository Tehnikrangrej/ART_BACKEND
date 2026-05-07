const express = require('express');
const router = express.Router();

const {
  createRepresentativeRequest,
  getMyRepresentativeRequests,
  getMyRepresentatives,
  getAllRepresentativeRequests,
  approveRepresentativeRequest,
  rejectRepresentativeRequest,
} = require('../controllers/representativeController');

const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles, requireVerified } = require('../middlewares/roleMiddleware');

// ─── CLIENT — submit & track ──────────────────────────────────────────────────
router.post('/request',
  protect,
  requireVerified,
  authorizeRoles('CLIENT'),
  createRepresentativeRequest
);

router.get('/my-requests',
  protect,
  requireVerified,
  authorizeRoles('CLIENT'),
  getMyRepresentativeRequests
);

// @desc  Get all representatives who belong to this CLIENT
router.get('/my-team',
  protect,
  requireVerified,
  authorizeRoles('CLIENT'),
  getMyRepresentatives
);

// ─── SUPERADMIN / ADMIN — manage requests ────────────────────────────────────
router.get('/requests',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  getAllRepresentativeRequests
);

router.put('/requests/:id/approve',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  approveRepresentativeRequest
);

router.put('/requests/:id/reject',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  rejectRepresentativeRequest
);

module.exports = router;
