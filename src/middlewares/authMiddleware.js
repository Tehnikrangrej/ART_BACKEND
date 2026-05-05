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
        select: { id: true, name: true, email: true, role: true, twoFactorAuth: true }
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

module.exports = { protect, admin };



