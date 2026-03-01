// ============================================================
// src/controllers/financeController.js
// General ledger — Revenue & Expense tracking
// ============================================================

const db = require("../config/db");

async function getAll(req, res) {
  try {
    const {
      type = "",
      category = "",
      status = "",
      from = "",
      to = "",
      page = 1,
      limit = 50,
    } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let i = 1;

    if (type) {
      conditions.push(`type = $${i}`);
      params.push(type);
      i++;
    }
    if (category) {
      conditions.push(`category = $${i}`);
      params.push(category);
      i++;
    }
    if (status) {
      conditions.push(`status = $${i}`);
      params.push(status);
      i++;
    }
    if (from) {
      conditions.push(`date >= $${i}`);
      params.push(from);
      i++;
    }
    if (to) {
      conditions.push(`date <= $${i}`);
      params.push(to);
      i++;
    }

    const WHERE = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const { rows } = await db.query(
      `
      SELECT * FROM transactions ${WHERE}
      ORDER BY date DESC, id DESC
      LIMIT $${i} OFFSET $${i + 1}
    `,
      [...params, limit, offset],
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM transactions ${WHERE}`,
      params,
    );

    return res.json({ data: rows, total: parseInt(countRows[0].count) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch transactions." });
  }
}

async function create(req, res) {
  try {
    const { type, description, amount, category, status, date } = req.body;
    if (!type || !description || !amount || !category) {
      return res
        .status(400)
        .json({ error: "type, description, amount, category required." });
    }

    // Enforce sign: revenue positive, expense negative
    const signedAmount =
      type === "Expense" ? -Math.abs(amount) : Math.abs(amount);

    const { rows } = await db.query(
      `
      INSERT INTO transactions (type, description, amount, category, status, date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        type,
        description,
        signedAmount,
        category,
        status || "Pending",
        date || new Date(),
        req.user.id,
      ],
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create transaction." });
  }
}

async function update(req, res) {
  try {
    const { type, description, amount, category, status, date } = req.body;
    const signedAmount =
      type === "Expense" ? -Math.abs(amount) : Math.abs(amount);

    const { rows } = await db.query(
      `
      UPDATE transactions
      SET type=$1, description=$2, amount=$3, category=$4, status=$5, date=$6, updated_at=NOW()
      WHERE id=$7 RETURNING *
    `,
      [type, description, signedAmount, category, status, date, req.params.id],
    );

    if (!rows[0])
      return res.status(404).json({ error: "Transaction not found." });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update transaction." });
  }
}

async function remove(req, res) {
  try {
    const { rows } = await db.query(
      "DELETE FROM transactions WHERE id=$1 RETURNING id",
      [req.params.id],
    );
    if (!rows[0])
      return res.status(404).json({ error: "Transaction not found." });
    return res.json({ message: "Deleted", id: rows[0].id });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete." });
  }
}

async function getStats(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type='Revenue'), 0)              AS total_revenue,
        COALESCE(SUM(ABS(amount)) FILTER (WHERE type='Expense'), 0)         AS total_expenses,
        COALESCE(SUM(amount), 0)                                             AS net_income,
        COUNT(*) FILTER (WHERE status='Pending')                             AS pending_count,
        COUNT(*)                                                             AS total_count
      FROM transactions
    `);

    const { rows: monthly } = await db.query(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        SUM(amount) FILTER (WHERE type='Revenue')        AS revenue,
        SUM(ABS(amount)) FILTER (WHERE type='Expense')   AS expenses
      FROM transactions
      GROUP BY month ORDER BY month DESC LIMIT 12
    `);

    const { rows: byCategory } = await db.query(`
      SELECT category,
        SUM(amount) FILTER (WHERE type='Revenue')        AS revenue,
        SUM(ABS(amount)) FILTER (WHERE type='Expense')   AS expenses
      FROM transactions
      GROUP BY category ORDER BY revenue DESC NULLS LAST
    `);

    return res.json({
      summary: rows[0],
      monthly: monthly.reverse(),
      byCategory,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch finance stats." });
  }
}

module.exports = { getAll, create, update, remove, getStats };
