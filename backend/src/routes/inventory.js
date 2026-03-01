// ============================================================
// src/routes/inventory.js
// All routes require JWT auth + 'inventory' permission
// ============================================================

const router = require("express").Router();
const c = require("../controllers/inventoryController");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

// Apply auth + permission check to ALL routes in this file
router.use(authenticate, authorize("inventory"));

// Routes
router.get("/stats", c.getStats); // GET   /api/inventory/stats
router.get("/", c.getAll); // GET   /api/inventory
router.post("/", c.create); // POST  /api/inventory
router.put("/:id", c.update); // PUT   /api/inventory/1
router.patch("/:id/restock", c.restock); // PATCH /api/inventory/1/restock
router.delete("/:id", c.remove); // DELETE /api/inventory/1

module.exports = router;
