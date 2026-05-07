/**
 * @desc  Role-Based Access Control middleware
 * @usage authorizeRoles('SUPERADMIN', 'ADMIN')
 *
 * Must be used AFTER the `protect` middleware.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized. Please log in.'));
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(
          `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`
        )
      );
    }

    next();
  };
};

/**
 * @desc  Ensure the authenticated user has verified their email.
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    res.status(401);
    return next(new Error('Not authorized. Please log in.'));
  }

  if (!req.user.isVerified) {
    res.status(403);
    return next(
      new Error(
        'Account not verified. Please verify your email before accessing this resource.'
      )
    );
  }

  next();
};

module.exports = { authorizeRoles, requireVerified };
