const express = require('express');
const router = express.Router();
const { getCollectionResources } = require('../controllers/ResourceController');
const { protect } = require('../middlewares/authMiddleware');

// @route   GET /api/collections/:id/external-resources
router.get('/:id/external-resources', protect, getCollectionResources);

module.exports = router;
