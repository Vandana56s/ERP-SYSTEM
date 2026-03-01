// ============================================================
// src/controllers/authController.js
// Handles: POST /api/auth/login
//          POST /api/auth/refresh
//          POST /api/auth/logout
//          GET  /api/auth/me
// ============================================================

const bcrypt = require("bcryptjs");
const db = require("../config/db");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

// ------------------------------------------------------------------
// LOGIN
// 1. Find user by email
// 2. Compare password hash
// 3. Generate access + refresh tokens
// 4. Store refresh token in DB for rotation/revocation
// ------------------------------------------------------------------
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // Join users with roles to get permissions
    const { rows } = await db.query(
      `
      SELECT u.id, u.email, u.name, u.avatar, u.password_hash, u.is_active,
             r.name AS role_name, r.label AS role_label, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `,
      [email.toLowerCase().trim()],
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.is_active) {
      return res
        .status(403)
        .json({ error: "Account is deactivated. Contact admin." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token in DB (allows logout & rotation)
    await db.query(
      "UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2",
      [refreshToken, user.id],
    );

    // Return user info + tokens (never return password_hash!)
    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role_name,
        roleLabel: user.role_label,
        permissions: user.permissions,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error during login." });
  }
}

// ------------------------------------------------------------------
// REFRESH TOKEN
// Exchange a valid refresh token for a new access token
// ------------------------------------------------------------------
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required." });
    }

    // Verify token signature
    const decoded = verifyRefreshToken(refreshToken);

    // Check token exists in DB (prevents reuse after logout)
    const { rows } = await db.query(
      `
      SELECT u.id, u.email, u.name, u.avatar, u.is_active,
             r.name AS role_name, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.refresh_token = $2
    `,
      [decoded.id, refreshToken],
    );

    if (!rows[0]) {
      return res
        .status(403)
        .json({ error: "Invalid or revoked refresh token." });
    }

    const user = rows[0];
    const newAccessToken = signAccessToken(user);

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ error: "Invalid refresh token." });
  }
}

// ------------------------------------------------------------------
// LOGOUT — invalidate refresh token in DB
// ------------------------------------------------------------------
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.query(
        "UPDATE users SET refresh_token = NULL WHERE refresh_token = $1",
        [refreshToken],
      );
    }
    return res.json({ message: "Logged out successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Logout failed." });
  }
}

// ------------------------------------------------------------------
// GET /me — return current user profile from token
// ------------------------------------------------------------------
async function getMe(req, res) {
  try {
    const { rows } = await db.query(
      `
      SELECT u.id, u.email, u.name, u.avatar, u.last_login,
             r.name AS role, r.label AS role_label, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `,
      [req.user.id],
    );

    if (!rows[0]) return res.status(404).json({ error: "User not found." });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch user." });
  }
}

module.exports = { login, refresh, logout, getMe };
