// ============================================================
// src/routes/finance.js
// All routes require JWT auth + 'finance' permission
// ============================================================

const router = require("express").Router();
const c = require("../controllers/financeController");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

// Apply auth + permission check to ALL routes in this file
router.use(authenticate, authorize("finance"));

// Routes
router.get("/stats", c.getStats); // GET  /api/finance/stats
router.get("/", c.getAll); // GET  /api/finance
router.post("/", c.create); // POST /api/finance
router.put("/:id", c.update); // PUT  /api/finance/1
router.delete("/:id", c.remove); // DELETE /api/finance/1

module.exports = router;
