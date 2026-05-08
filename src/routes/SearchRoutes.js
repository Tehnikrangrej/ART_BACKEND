const express = require('express');
const router = express.Router();
const { searchArtWorks, searchUsers } = require('../controllers/SearchController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// @route   GET /api/search
router.get('/', protect, searchArtWorks);

// @route   GET /api/search/users
router.get('/users', protect, authorizeRoles('SUPERADMIN', 'ADMIN', 'CLIENT', 'CLIENT_REPRESENTATIVE'), searchUsers);

module.exports = router;
