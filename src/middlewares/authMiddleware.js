const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, twoFactorAuth: true, isVerified: true }
      });

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, session expired or token invalid');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMINISTRATOR') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an administrator.');
  }
};

const checkPermission = async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, no user info.');
  }

  // Administrators bypass all permission checks
  if (req.user.role === 'ADMINISTRATOR') {
    return next();
  }

  // Derive permission name from request
  const methodToAction = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };

  // Extract resource from path (e.g., /api/artwork/123 -> ARTWORK)
  // We strip /api/ and any ID parameters (numeric or UUID)
  const pathParts = req.baseUrl.split('/').concat(req.path.split('/')).filter(p => p && p !== 'api');
  const resourcePart = pathParts.find(p => !p.startsWith(':') && !/^[0-9a-fA-F-]{36}$/.test(p) && !/^\d+$/.test(p));
  const resource = resourcePart ? resourcePart.toUpperCase() : 'GENERAL';
  const action = methodToAction[req.method] || 'READ';
  const requiredPermission = `${action}_${resource}`;

  // Check if the role has this permission
  const hasPermission = await prisma.rolePermission.findFirst({
    where: {
      role: req.user.role,
      permission: {
        name: requiredPermission
      }
    }
  });

  if (hasPermission) {
    next();
  } else {
    res.status(403);
    throw new Error(`Access denied. You do not have permission to ${action.toLowerCase()} ${resource.toLowerCase()}.`);
  }
};

module.exports = { protect, admin, checkPermission };


