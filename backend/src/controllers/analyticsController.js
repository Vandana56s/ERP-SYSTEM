// ============================================================
// src/controllers/analyticsController.js
// Cross-module analytics — aggregates data from all tables
// ============================================================

const db = require("../config/db");

// GET /api/analytics/dashboard
async function getDashboard(req, res) {
  try {
    // Employee stats
    const { rows: empStats } = await db.query(`
      SELECT 
        COUNT(*)                                          AS total, 
        COUNT(*) FILTER (WHERE status='Active')          AS active,
        SUM(salary)                                      AS payroll, 
        ROUND(AVG(salary), 2)                            AS avg_salary
      FROM employees
    `);

    // Finance stats
    const { rows: finStats } = await db.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type='Revenue'), 0)        AS revenue,
        COALESCE(SUM(ABS(amount)) FILTER (WHERE type='Expense'), 0)   AS expenses,
        COALESCE(SUM(amount), 0)                                       AS net_income,
        COUNT(*) FILTER (WHERE status='Pending')                       AS pending_tx
      FROM transactions
    `);

    // Inventory stats
    const { rows: invStats } = await db.query(`
      SELECT 
        COUNT(*)                                               AS total, 
        COALESCE(SUM(quantity * price), 0)                    AS value,
        COUNT(*) FILTER (WHERE status='Low Stock')            AS low_stock,
        COUNT(*) FILTER (WHERE status='Out of Stock')         AS out_of_stock
      FROM inventory
    `);

    // Monthly revenue trend (last 7 months)
    const { rows: trend } = await db.query(`
      SELECT 
        TO_CHAR(date, 'Mon YY') AS label,
        COALESCE(SUM(amount) FILTER (WHERE type='Revenue'), 0)      AS revenue,
        COALESCE(SUM(ABS(amount)) FILTER (WHERE type='Expense'), 0) AS expenses
      FROM transactions
      WHERE date >= NOW() - INTERVAL '7 months'
      GROUP BY TO_CHAR(date, 'Mon YY'), DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date)
    `);

    // Department headcount
    const { rows: deptCount } = await db.query(`
      SELECT department, COUNT(*) AS count, SUM(salary) AS payroll
      FROM employees 
      GROUP BY department 
      ORDER BY count DESC
    `);

    // Recent transactions
    const { rows: recentTx } = await db.query(`
      SELECT * FROM transactions 
      ORDER BY date DESC, id DESC 
      LIMIT 5
    `);

    return res.json({
      employees: empStats[0],
      finance: finStats[0],
      inventory: invStats[0],
      trend,
      departments: deptCount,
      recentTx,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch dashboard data." });
  }
}

module.exports = { getDashboard };
