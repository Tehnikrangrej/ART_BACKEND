const express = require('express');
const router = express.Router();
const {
  createShareLink,
  getSharedLinkArtworks,
} = require('../controllers/shareLinkController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

/**
 * @route   POST /api/share-links
 * @desc    Create a new share link (CLIENT only)
 * @access  Private
 */
router.post(
  '/',
  protect,
  authorizeRoles('CLIENT'),
  createShareLink
);


router.get('/share/:token', protect, getSharedLinkArtworks);

module.exports = router;
