const express = require('express');
const router = express.Router();
const { searchArtWorks } = require('../controllers/SearchController');
const { protect } = require('../middlewares/authMiddleware');
// @route   GET /api/search
router.get('/', protect, searchArtWorks);
module.exports = router;
