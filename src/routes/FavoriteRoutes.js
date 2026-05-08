const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getFavorites,
} = require('../controllers/FavoriteController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// All routes are protected and restricted to CLIENT and CLIENT_REPRESENTATIVE
router.use(protect);
router.use(authorizeRoles('CLIENT', 'CLIENT_REPRESENTATIVE'));

// @route   GET /api/favorites
router.get('/', getFavorites);

// @route   POST /api/favorites/:artworkId
router.post('/:artworkId', addFavorite);

// @route   DELETE /api/favorites/:artworkId
router.delete('/:artworkId', removeFavorite);

module.exports = router;
