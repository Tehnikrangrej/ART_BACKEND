const express = require('express');
const router = express.Router();
const {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignRoleToUser
} = require('../controllers/RoleController');
const { protect, admin } = require('../middlewares/authMiddleware');

// All routes are protected and require admin access
router.use(protect);
router.use(admin);

router.post('/', createRole);
router.get('/', getRoles);
router.get('/:id', getRoleById);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);
router.put('/assign-to-user/:id', assignRoleToUser);

module.exports = router;
