const express = require('express');
const router = express.Router();
const {
  addResource,
  getResources,
  updateResource,
  deleteResource,
} = require('../controllers/ResourceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Public/Shared access for reading
router.get('/', protect, getResources);

// Admin-only management
router.post(
  '/',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  addResource
);

router.put(
  '/:id',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  updateResource
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  deleteResource
);

module.exports = router;
