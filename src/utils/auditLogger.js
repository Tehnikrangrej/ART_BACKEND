const prisma = require('../prismaClient');

/**
 * Manual Audit Logger for non-API functions (Cron jobs, background tasks, etc.)
 * @param {Object} data - Log data
 * @param {String} data.action - Descriptive name of the action (e.g., 'CRON_CLEANUP_LINKS')
 * @param {String} [data.userId] - Optional user ID
 * @param {String} [data.userEmail] - Optional user email
 * @param {Object} [data.payload] - Data being processed
 * @param {Number} [data.statusCode] - Result status code
 */
const logAudit = async ({ action, userId, userEmail, payload, statusCode }) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        method: 'INTERNAL',
        endpoint: 'SYSTEM_FUNCTION',
        userId: userId || null,
        userEmail: userEmail || null,
        payload: payload || {},
        statusCode: statusCode || 200,
        ipAddress: 'SERVER_INTERNAL',
      },
    });
  } catch (error) {
    console.error('[Manual AuditLog Error]', error.message);
  }
};

module.exports = logAudit;
