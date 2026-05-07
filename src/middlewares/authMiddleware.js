const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

/**
 * @desc   Protect routes — verifies JWT and attaches user to req.user
 * @usage  router.get('/route', protect, handler)
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user — include artwork access and representative info
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          parentId: true,
          isVerified: true,
          twoFactorAuth: true,
          createdAt: true,
        },
      });

      if (!req.user) {
        res.status(401);
        return next(new Error('Not authorized. User account not found.'));
      }

      return next();
    } catch (error) {
      res.status(401);
      return next(new Error('Not authorized. Session expired or token invalid.'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized. No token provided.'));
  }
};

module.exports = { protect };
