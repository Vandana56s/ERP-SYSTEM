// ============================================================
// src/middleware/rbac.js
// Role-Based Access Control middleware.
// Used AFTER authenticate() to check if the user's role
// has the required permission for a given route.
//
// Usage in routes:
//   router.get('/', authenticate, authorize('employees'), handler)
// ============================================================

function authorize(...requiredPermissions) {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions || [];

    // 'all' permission = admin bypass
    if (userPermissions.includes("all")) {
      return next();
    }

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some((p) =>
      userPermissions.includes(p),
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: `Access denied. Required permission: ${requiredPermissions.join(" or ")}`,
        yourRole: req.user?.role,
      });
    }

    next();
  };
}

module.exports = { authorize };
