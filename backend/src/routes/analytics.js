// ============================================================
// src/routes/analytics.js
// Requires JWT auth + 'dashboard' permission
// (all roles have at least dashboard permission)
// ============================================================

const router = require("express").Router();
const { getDashboard } = require("../controllers/analyticsController");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

// GET /api/analytics/dashboard
router.get("/dashboard", authenticate, authorize("dashboard"), getDashboard);

module.exports = router;
