const roleAuth = allowedRoles => {
  return (req, res, next) => {
    try {
      const userRole = req.user_info?.role;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: '🚫 Access Denied! No role found in request.',
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `🚫 Unauthorized! You need one of these roles: ${allowedRoles.join(', ')}`,
        });
      }

      next(); // User is authorized
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '❌ Internal Server Error in Role Authentication',
        error: error.message,
      });
    }
  };
};

module.exports = roleAuth;
