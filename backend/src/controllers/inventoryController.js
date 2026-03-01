// ============================================================
// src/controllers/inventoryController.js
// Stock management — CRUD + restock + stats
// ============================================================

const db = require("../config/db");

async function getAll(req, res) {
  try {
    const {
      search = "",
      category = "",
      status = "",
      page = 1,
      limit = 50,
    } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let i = 1;

    if (search) {
      conditions.push(`(name ILIKE $${i} OR sku ILIKE $${i})`);
      params.push(`%${search}%`);
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

    const WHERE = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const { rows } = await db.query(
      `
      SELECT * FROM inventory ${WHERE}
      ORDER BY created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
    `,
      [...params, limit, offset],
    );

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM inventory ${WHERE}`,
      params,
    );

    return res.json({ data: rows, total: parseInt(countRows[0].count) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch inventory." });
  }
}

async function create(req, res) {
  try {
    const {
      name,
      sku,
      category,
      quantity,
      price,
      reorder_point,
      supplier,
      status,
    } = req.body;
    if (!name || !sku || !category) {
      return res.status(400).json({ error: "name, sku, category required." });
    }

    // Auto-calculate status based on quantity vs reorder point
    const qty = parseInt(quantity) || 0;
    const reorder = parseInt(reorder_point) || 10;
    const autoStatus =
      qty === 0 ? "Out of Stock" : qty <= reorder ? "Low Stock" : "In Stock";

    const { rows } = await db.query(
      `
      INSERT INTO inventory (name, sku, category, quantity, price, reorder_point, supplier, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        name,
        sku,
        category,
        qty,
        price || 0,
        reorder,
        supplier,
        status || autoStatus,
      ],
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "SKU already exists." });
    return res.status(500).json({ error: "Failed to create item." });
  }
}

async function update(req, res) {
  try {
    const {
      name,
      sku,
      category,
      quantity,
      price,
      reorder_point,
      supplier,
      status,
    } = req.body;
    const qty = parseInt(quantity) || 0;
    const reorder = parseInt(reorder_point) || 10;
    const autoStatus =
      status ||
      (qty === 0 ? "Out of Stock" : qty <= reorder ? "Low Stock" : "In Stock");

    const { rows } = await db.query(
      `
      UPDATE inventory
      SET name=$1, sku=$2, category=$3, quantity=$4, price=$5, reorder_point=$6,
          supplier=$7, status=$8, updated_at=NOW()
      WHERE id=$9 RETURNING *
    `,
      [
        name,
        sku,
        category,
        qty,
        price,
        reorder,
        supplier,
        autoStatus,
        req.params.id,
      ],
    );

    if (!rows[0]) return res.status(404).json({ error: "Item not found." });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update item." });
  }
}

// PATCH /api/inventory/:id/restock — quick restock action
async function restock(req, res) {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Restock quantity must be > 0." });
    }

    const { rows } = await db.query(
      `
      UPDATE inventory
      SET quantity = quantity + $1,
          status = CASE WHEN quantity + $1 > reorder_point THEN 'In Stock' ELSE status END,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
      [quantity, req.params.id],
    );

    if (!rows[0]) return res.status(404).json({ error: "Item not found." });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Restock failed." });
  }
}

async function remove(req, res) {
  try {
    const { rows } = await db.query(
      "DELETE FROM inventory WHERE id=$1 RETURNING id",
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Item not found." });
    return res.json({ message: "Deleted", id: rows[0].id });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete item." });
  }
}

async function getStats(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)                                               AS total_items,
        COALESCE(SUM(quantity * price), 0)                     AS total_value,
        COUNT(*) FILTER (WHERE status = 'In Stock')            AS in_stock,
        COUNT(*) FILTER (WHERE status = 'Low Stock')           AS low_stock,
        COUNT(*) FILTER (WHERE status = 'Out of Stock')        AS out_of_stock
      FROM inventory
    `);

    const { rows: byCategory } = await db.query(`
      SELECT category,
        COUNT(*) AS count,
        SUM(quantity * price) AS value
      FROM inventory
      GROUP BY category ORDER BY value DESC
    `);

    return res.json({ summary: rows[0], byCategory });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch inventory stats." });
  }
}

module.exports = { getAll, create, update, remove, restock, getStats };
