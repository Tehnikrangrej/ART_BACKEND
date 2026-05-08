const express = require('express');
const router = express.Router();
const {
  addToShortlist,
  removeFromShortlist,
  getShortlistedArtworks,
} = require('../controllers/ShortlistController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// All routes are protected and restricted to CLIENT and CLIENT_REPRESENTATIVE
router.use(protect);
router.use(authorizeRoles('CLIENT', 'CLIENT_REPRESENTATIVE'));

// @route   GET /api/shortlists
router.get('/', getShortlistedArtworks);

// @route   POST /api/shortlists/:artworkId
router.post('/:artworkId', addToShortlist);

// @route   DELETE /api/shortlists/:artworkId
router.delete('/:artworkId', removeFromShortlist);

module.exports = router;
