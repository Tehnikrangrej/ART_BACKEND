const express = require('express');
const router = express.Router();
const {
  getVisibilitySettings,
  updateVisibilitySettings,
} = require('../controllers/ArtworkVisibilityController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// @route   GET /api/artworks/visibility-settings
router.get(
  '/visibility-settings',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  getVisibilitySettings
);

// @route   POST /api/artworks/visibility-settings
router.post(
  '/visibility-settings',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  updateVisibilitySettings
);

module.exports = router;
