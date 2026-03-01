// ============================================================
// src/routes/auth.js
// Public routes — no auth required for login/refresh
// ============================================================

const router = require("express").Router();
const {
  login,
  refresh,
  logout,
  getMe,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// Public — no token needed
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Protected — token required to get current user info
router.get("/me", authenticate, getMe);

module.exports = router;
