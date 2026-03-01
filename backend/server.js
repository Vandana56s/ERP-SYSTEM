// ============================================================
// server.js — NexusERP Express Server
//
// ARCHITECTURE OVERVIEW:
//   Request → Helmet → CORS → Rate Limiter → Routes
//                                              ↓
//                                  authenticate (JWT check)
//                                              ↓
//                                  authorize (RBAC check)
//                                              ↓
//                                  Controller → DB Query
// ============================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// ── Security Headers (prevents common web attacks)
app.use(helmet());

// ── CORS (allow frontend to call this API)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting (prevent brute force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window per IP
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

// Stricter limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});
app.use("/api/auth/login", authLimiter);

// ── Routes
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/employees", require("./src/routes/employees"));
app.use("/api/finance", require("./src/routes/finance"));
app.use("/api/inventory", require("./src/routes/inventory"));
app.use("/api/analytics", require("./src/routes/analytics"));

// ── Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), version: "1.0.0" });
});

// ── 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// ── Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  NexusERP API running on http://localhost:${PORT}`);
  console.log(`📋  Health check: http://localhost:${PORT}/api/health\n`);
});
