// Middleware to check if user has required role(s)
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Specific role checkers for convenience
const isAdmin = checkRole('admin');
const isDriver = checkRole('driver');
const isUser = checkRole('user');
const isDriverOrAdmin = checkRole('driver', 'admin');

module.exports = {
  checkRole,
  isAdmin,
  isDriver,
  isUser,
  isDriverOrAdmin
};
