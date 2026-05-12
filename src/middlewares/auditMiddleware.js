const prisma = require('../prismaClient');

/**
 * Middleware to log API requests for auditing purposes.
 * Captures user info (if authenticated), endpoint, method, status code, and sanitized payload.
 */
const auditLogMiddleware = async (req, res, next) => {
  // We hook into the 'finish' event to capture the response status code
  res.on('finish', async () => {
    try {
      // 1. Basic Request Info
      const { method, originalUrl, body, user } = req;
      const statusCode = res.statusCode;

      // 2. Identify the User
      // Note: req.user is populated by the 'protect' middleware
      const userId = user ? user.id : null;
      const userEmail = user ? user.email : null;

      // 3. Define the Action
      const action = `${method} ${originalUrl}`;

      // 4. Sanitize Payload (Remove sensitive data like passwords)
      const sanitizedPayload = { ...body };
      const sensitiveFields = ['password', 'token', 'otp'];
      sensitiveFields.forEach((field) => {
        if (sanitizedPayload[field]) {
          sanitizedPayload[field] = '********';
        }
      });

      // 5. Capture IP Address
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

      // 6. Save to Database
      await prisma.auditLog.create({
        data: {
          userId,
          userEmail,
          action,
          method,
          endpoint: originalUrl,
          payload: sanitizedPayload,
          ipAddress: typeof ipAddress === 'string' ? ipAddress : JSON.stringify(ipAddress),
          statusCode,
        },
      });
    } catch (error) {
      // Silent fail for logging errors to prevent breaking the main app flow
      console.error('[AuditLog Error]', error.message);
    }
  });

  next();
};

module.exports = auditLogMiddleware;
