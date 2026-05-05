const express = require('express');
const router = express.Router();
const {
  createPermission,
  getAllPermissions,
  deletePermission,
  assignPermissionToRole,
  revokePermissionFromRole
} = require('../controllers/PermissionController');

router.route('/')
  .post(createPermission)
  .get(getAllPermissions);

router.route('/:id')
  .delete(deletePermission);

router.post('/assign', assignPermissionToRole);
router.delete('/revoke', revokePermissionFromRole);

module.exports = router;
