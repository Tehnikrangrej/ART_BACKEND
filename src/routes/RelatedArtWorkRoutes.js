const express = require('express');
const router = express.Router();
const {
  getRelatedArtWorks,
  updateRelatedWorkSettings,
} = require('../controllers/RelatedArtWorkController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// @route   GET /api/artworks/:id/related
router.get('/:id/related', protect, getRelatedArtWorks);

// @route   POST /api/artworks/related-settings
router.post(
  '/related-settings',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  updateRelatedWorkSettings
);

module.exports = router;
