const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditLogById } = require('../controllers/AuditLogController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// All audit log routes are restricted to Admins and Superadmins
router.use(protect);
router.use(authorizeRoles('SUPERADMIN', 'ADMIN'));

// @route   GET /api/admin/audit-logs
router.get('/', getAuditLogs);

// @route   GET /api/admin/audit-logs/:id
router.get('/:id', getAuditLogById);

module.exports = router;
