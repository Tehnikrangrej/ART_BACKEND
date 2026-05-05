const prisma = require('../prismaClient');

/**
 * Middleware to check if a user has a specific permission.
 * @param {string} requiredPermission - Optional. If provided, checks for this specific permission. 
 *                                      If not provided, derives it from the request method and path.
 */
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, no user info found.');
    }

    // Administrators bypass all permission checks
    if (req.user.role && req.user.role.name === 'ADMINISTRATOR') {
      return next();
    }

    let permissionName = requiredPermission;

    // If no specific permission is provided, derive it dynamically from the request
    if (!permissionName) {
      const methodToAction = {
        'GET': 'READ',
        'POST': 'CREATE',
        'PUT': 'UPDATE',
        'PATCH': 'UPDATE',
        'DELETE': 'DELETE'
      };

      // Extract resource from path (e.g., /api/artworks/123 -> ARTWORKS)
      const pathParts = (req.baseUrl + req.path).split('/').filter(p => p && p !== 'api');
      const resourcePart = pathParts.find(p => !p.startsWith(':') && !/^[0-9a-fA-F-]{36}$/.test(p) && !/^\d+$/.test(p));
      const resource = resourcePart ? resourcePart.toUpperCase() : 'GENERAL';
      const action = methodToAction[req.method] || 'READ';
      
      permissionName = `${action}_${resource}`;
    }

    // Check if the user's role has this permission in the database
    const hasPermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: req.user.roleId,
        permission: {
          name: permissionName
        }
      }
    });

    if (hasPermission) {
      next();
    } else {
      res.status(403);
      // Friendly error message
      const displayAction = permissionName.split('_')[0].toLowerCase();
      const displayResource = permissionName.split('_').slice(1).join(' ').toLowerCase();
      throw new Error(`Access denied. You do not have permission to ${displayAction} ${displayResource}.`);
    }
  };
};

module.exports = checkPermission;
