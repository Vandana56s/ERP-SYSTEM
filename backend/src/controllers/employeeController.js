// ============================================================
// src/controllers/employeeController.js
// CRUD operations for the HR / Employee module
// ============================================================

const db = require("../config/db");

// GET /api/employees?search=&department=&status=&page=1&limit=20
async function getAll(req, res) {
  try {
    const {
      search = "",
      department = "",
      status = "",
      page = 1,
      limit = 20,
    } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let i = 1;

    if (search) {
      conditions.push(`(name ILIKE $${i} OR email ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }
    if (department) {
      conditions.push(`department = $${i}`);
      params.push(department);
      i++;
    }
    if (status) {
      conditions.push(`status = $${i}`);
      params.push(status);
      i++;
    }

    const WHERE = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const { rows } = await db.query(
      `
      SELECT * FROM employees
      ${WHERE}
      ORDER BY created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
    `,
      [...params, limit, offset],
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM employees ${WHERE}`,
      params,
    );

    return res.json({
      data: rows,
      total: parseInt(countRows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch employees." });
  }
}

// GET /api/employees/:id
async function getOne(req, res) {
  try {
    const { rows } = await db.query("SELECT * FROM employees WHERE id = $1", [
      req.params.id,
    ]);
    if (!rows[0]) return res.status(404).json({ error: "Employee not found." });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch employee." });
  }
}

// POST /api/employees
async function create(req, res) {
  try {
    const { name, email, department, role, salary, status, joined_at } =
      req.body;
    if (!name || !email || !department || !role) {
      return res
        .status(400)
        .json({ error: "name, email, department, role are required." });
    }

    const avatar = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const { rows } = await db.query(
      `
      INSERT INTO employees (name, email, department, role, salary, status, avatar, joined_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        name,
        email,
        department,
        role,
        salary || 0,
        status || "Active",
        avatar,
        joined_at || new Date(),
      ],
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "Email already exists." });
    console.error(err);
    return res.status(500).json({ error: "Failed to create employee." });
  }
}

// PUT /api/employees/:id
async function update(req, res) {
  try {
    const { name, email, department, role, salary, status, joined_at } =
      req.body;
    const { rows } = await db.query(
      `
      UPDATE employees
      SET name=$1, email=$2, department=$3, role=$4, salary=$5, status=$6, joined_at=$7, updated_at=NOW()
      WHERE id=$8
      RETURNING *
    `,
      [name, email, department, role, salary, status, joined_at, req.params.id],
    );

    if (!rows[0]) return res.status(404).json({ error: "Employee not found." });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update employee." });
  }
}

// DELETE /api/employees/:id
async function remove(req, res) {
  try {
    const { rows } = await db.query(
      "DELETE FROM employees WHERE id=$1 RETURNING id",
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Employee not found." });
    return res.json({ message: "Employee deleted.", id: rows[0].id });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete employee." });
  }
}

// GET /api/employees/stats — aggregated stats for dashboard
async function getStats(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)                                             AS total,
        COUNT(*) FILTER (WHERE status = 'Active')           AS active,
        COUNT(*) FILTER (WHERE status = 'On Leave')         AS on_leave,
        COUNT(*) FILTER (WHERE status = 'Inactive')         AS inactive,
        SUM(salary)                                         AS total_payroll,
        ROUND(AVG(salary), 2)                               AS avg_salary
      FROM employees
    `);

    const { rows: deptRows } = await db.query(`
      SELECT department, COUNT(*) AS count, SUM(salary) AS payroll
      FROM employees GROUP BY department ORDER BY count DESC
    `);

    return res.json({ summary: rows[0], departments: deptRows });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch employee stats." });
  }
}

module.exports = { getAll, getOne, create, update, remove, getStats };
