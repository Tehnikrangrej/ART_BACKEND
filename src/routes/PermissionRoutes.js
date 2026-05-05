const express = require('express');
const router = express.Router();
const {
  createPermission,
  getAllPermissions,
  deletePermission,
  assignPermissionToRole,
  revokePermissionFromRole
} = require('../controllers/PermissionController');
const { protect, admin } = require('../middlewares/authMiddleware');

// All permission management routes are restricted to Administrators
router.use(protect);
router.use(admin);

router.post('/', createPermission);
router.get('/', getAllPermissions);
router.delete('/:id', deletePermission);

router.post('/assign', assignPermissionToRole);
router.delete('/revoke', revokePermissionFromRole);

module.exports = router;
