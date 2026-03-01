// ============================================================
// src/routes/employees.js
// All routes require JWT auth + 'employees' permission
// ============================================================

const router = require("express").Router();
const c = require("../controllers/employeeController");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

// Apply auth + permission check to ALL routes in this file
router.use(authenticate, authorize("employees"));

// Routes
router.get("/stats", c.getStats); // GET  /api/employees/stats
router.get("/", c.getAll); // GET  /api/employees
router.get("/:id", c.getOne); // GET  /api/employees/1
router.post("/", c.create); // POST /api/employees
router.put("/:id", c.update); // PUT  /api/employees/1
router.delete("/:id", c.remove); // DELETE /api/employees/1

module.exports = router;
