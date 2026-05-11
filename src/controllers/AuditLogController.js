const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

// @desc    Get all audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (SUPERADMIN, ADMIN)
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  // Filters (optional)
  const { userId, method, statusCode } = req.query;
  const where = {
    ...(userId && { userId }),
    ...(method && { method: method.toUpperCase() }),
    ...(statusCode && { statusCode: parseInt(statusCode) }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: logs,
  });
});

// @desc    Get audit log by ID
// @route   GET /api/admin/audit-logs/:id
// @access  Private (SUPERADMIN, ADMIN)
const getAuditLogById = asyncHandler(async (req, res) => {
  const log = await prisma.auditLog.findUnique({
    where: { id: req.params.id },
  });

  if (!log) {
    res.status(404);
    throw new Error('Audit log entry not found.');
  }

  res.json({
    success: true,
    data: log,
  });
});

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
