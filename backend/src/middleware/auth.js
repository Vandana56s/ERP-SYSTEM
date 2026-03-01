// ============================================================
// src/middleware/auth.js
// Middleware that runs BEFORE protected route handlers.
// Extracts the JWT from the Authorization header and validates it.
// If valid, attaches decoded user info to req.user.
// ============================================================

const { verifyAccessToken } = require("../utils/jwt");

function authenticate(req, res, next) {
  // Expect: "Authorization: Bearer <token>"
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    // Attach user info so route handlers can use it
    req.user = decoded; // { id, email, role, permissions }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please refresh." });
    }
    return res.status(403).json({ error: "Invalid token." });
  }
}

module.exports = { authenticate };
