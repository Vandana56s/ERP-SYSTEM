// ============================================================
// src/utils/jwt.js
// Helper functions to sign and verify JWT tokens.
//
// STRATEGY: Two-token system
//   • Access Token  — short-lived (15min), sent in Authorization header
//   • Refresh Token — long-lived (7d), stored in DB, used to get new access token
// ============================================================

const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

/**
 * Generate a short-lived access token.
 * Payload includes user id, email, and role for RBAC checks.
 */
function signAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role_name,
      permissions: user.permissions,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES },
  );
}

/**
 * Generate a long-lived refresh token.
 * Only contains user id — less data = less exposure.
 */
function signRefreshToken(userId) {
  return jwt.sign({ id: userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

/**
 * Verify an access token.
 * Returns decoded payload or throws an error.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * Verify a refresh token.
 * Returns decoded payload or throws an error.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
