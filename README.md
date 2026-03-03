# 🏢 Mini Enterprise ERP System

A full-stack ERP clone aligned with SAP concepts, built with:

- **Frontend**: React + Vite + React Router + Axios
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT (Access + Refresh Tokens)
- **RBAC**: Role-Based Access Control

---

## 📁 Full Project Structure

```
erp-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js  # Login, refresh, logout
│   │   │   ├── employeeController.js
│   │   │   ├── financeController.js
│   │   │   ├── inventoryController.js
│   │   │   └── analyticsController.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verify middleware
│   │   │   └── rbac.js            # Role permission checker
│   │   ├── models/
│   │   │   └── schema.sql         # All PostgreSQL table definitions
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── employees.js
│   │   │   ├── finance.js
│   │   │   ├── inventory.js
│   │   │   └── analytics.js
│   │   └── utils/
│   │       └── jwt.js             # Token helpers
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/            # Button, Badge, Modal, Table, StatCard
    │   │   └── layout/            # Sidebar, Topbar, Layout
    │   ├── pages/
    │   │   ├── auth/              # LoginPage
    │   │   ├── dashboard/         # Dashboard
    │   │   ├── employees/         # EmployeeList, EmployeeForm
    │   │   ├── finance/           # Transactions, LedgerTable
    │   │   ├── inventory/         # StockRegistry, ItemForm
    │   │   ├── analytics/         # Charts, KPI panels
    │   │   └── roles/             # RoleManager
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state
    │   ├── hooks/
    │   │   └── usePermission.js   # RBAC hook
    │   ├── services/
    │   │   └── api.js             # Axios instance + all API calls
    │   ├── utils/
    │   │   └── format.js          # Currency, date formatters
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Quick Start

### Step 1 — Prerequisites (all free)

- Node.js 20+ → https://nodejs.org
- PostgreSQL 16+ → https://www.postgresql.org/download/
- Git → https://git-scm.com

### Step 2 — Clone & Install

```bash
git clone <your-repo>
cd erp-system

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Step 3 — Database Setup

```bash
# Create database in psql
psql -U postgres
CREATE DATABASE nexuserp;
\q

# Run schema
psql -U postgres -d nexuserp -f backend/src/models/schema.sql
```

### Step 4 — Environment Variables

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials
```

### Step 5 — Run

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## 🔐 Default Users

| Email            | Password   | Role                |
| ---------------- | ---------- | ------------------- |
| admin@erp.io     | admin123   | Admin (full access) |
| finance@erp.io   | finance123 | Finance Manager     |
| hr@erp.io        | hr123      | HR Manager          |
| inventory@erp.io | inv123     | Inventory Manager   |
| viewer@erp.io    | viewer123  | Viewer (read-only)  |
