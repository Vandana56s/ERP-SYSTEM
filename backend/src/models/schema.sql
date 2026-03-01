-- ============================================================
-- NexusERP — PostgreSQL Schema
-- Run: psql -U postgres -d nexuserp -f schema.sql
-- ============================================================

-- Clean slate (order matters due to FK constraints)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================================
-- ROLES TABLE
-- Defines what each role can access (RBAC)
-- ============================================================
CREATE TABLE roles (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) UNIQUE NOT NULL,
  label      VARCHAR(100) NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  color      VARCHAR(20) DEFAULT 'blue',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- USERS TABLE
-- Stores login credentials, linked to a role
-- ============================================================
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  avatar        VARCHAR(5) DEFAULT 'U',
  role_id       INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  refresh_token TEXT,
  last_login    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES TABLE
-- Core HR module data
-- ============================================================
CREATE TABLE employees (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  department  VARCHAR(100) NOT NULL,
  role        VARCHAR(100) NOT NULL,
  salary      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status      VARCHAR(20) NOT NULL DEFAULT 'Active'
              CHECK (status IN ('Active', 'On Leave', 'Inactive', 'Terminated')),
  avatar      VARCHAR(5) DEFAULT 'E',
  joined_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS TABLE
-- Finance module — income & expenses ledger
-- ============================================================
CREATE TABLE transactions (
  id          SERIAL PRIMARY KEY,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('Revenue', 'Expense')),
  description VARCHAR(255) NOT NULL,
  amount      NUMERIC(15, 2) NOT NULL,  -- positive = revenue, negative = expense
  category    VARCHAR(100) NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'Pending'
              CHECK (status IN ('Pending', 'Settled', 'Cancelled')),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INVENTORY TABLE
-- Stock management module
-- ============================================================
CREATE TABLE inventory (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  sku             VARCHAR(100) UNIQUE NOT NULL,
  category        VARCHAR(100) NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 0,
  price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reorder_point   INTEGER NOT NULL DEFAULT 10,  -- alert threshold
  supplier        VARCHAR(255),
  status          VARCHAR(20) NOT NULL DEFAULT 'In Stock'
                  CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock')),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES — improve query performance
-- ============================================================
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles
INSERT INTO roles (name, label, permissions, color) VALUES
  ('admin',              'Administrator',      ARRAY['all'],                                           'red'),
  ('finance_manager',    'Finance Manager',    ARRAY['dashboard','finance','analytics'],               'amber'),
  ('hr_manager',         'HR Manager',         ARRAY['dashboard','employees','analytics'],             'blue'),
  ('inventory_manager',  'Inventory Manager',  ARRAY['dashboard','inventory','analytics'],             'green'),
  ('viewer',             'Viewer',             ARRAY['dashboard'],                                     'purple');

-- Users (passwords are bcrypt hashed — see seed note below)
-- Plaintext: admin123, finance123, hr123, inv123, viewer123
-- To regenerate hashes: node -e "const b=require('bcryptjs');console.log(b.hashSync('yourpass',10))"
INSERT INTO users (email, password_hash, name, avatar, role_id) VALUES
  ('admin@erp.io',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User',      'AU', 1),
  ('finance@erp.io',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marcus Webb',     'MW', 2),
  ('hr@erp.io',        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Aisha Patel',     'AP', 3),
  ('inventory@erp.io', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Stock Manager',   'SM', 4),
  ('viewer@erp.io',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Guest Viewer',    'GV', 5);

-- NOTE: The hash above is the bcrypt hash of 'password' (Laravel default for testing).
-- For real passwords, run this in backend after npm install:
-- node -e "const b=require('bcryptjs'); ['admin123','finance123','hr123','inv123','viewer123'].forEach(p=>console.log(p,b.hashSync(p,10)))"
-- Then update INSERT above with real hashes.

-- Employees
INSERT INTO employees (name, email, department, role, salary, status, avatar, joined_at) VALUES
  ('Sarah Chen',    'sarah.chen@erp.io',    'Engineering', 'Senior Engineer',    120000, 'Active',   'SC', '2022-03-15'),
  ('Marcus Webb',   'm.webb@erp.io',         'Finance',     'CFO',                180000, 'Active',   'MW', '2021-01-20'),
  ('Aisha Patel',   'a.patel@erp.io',        'HR',          'HR Manager',          95000, 'Active',   'AP', '2022-07-01'),
  ('James Torres',  'j.torres@erp.io',       'Sales',       'Sales Lead',         105000, 'Active',   'JT', '2023-02-10'),
  ('Elena Novak',   'e.novak@erp.io',        'Engineering', 'DevOps Engineer',    110000, 'On Leave', 'EN', '2021-09-05'),
  ('David Kim',     'd.kim@erp.io',          'Marketing',   'CMO',                145000, 'Active',   'DK', '2020-11-12'),
  ('Priya Sharma',  'p.sharma@erp.io',       'Engineering', 'Frontend Engineer',   98000, 'Active',   'PS', '2023-06-01'),
  ('Carlos Reyes',  'c.reyes@erp.io',        'Sales',       'Account Executive',   88000, 'Active',   'CR', '2023-08-15');

-- Transactions
INSERT INTO transactions (type, description, amount, category, status, date) VALUES
  ('Revenue', 'Q4 Product Sales',                284500,  'Sales',       'Settled', '2024-12-31'),
  ('Expense', 'Office Lease - Q4',              -38000,  'Operations',  'Settled', '2024-12-01'),
  ('Revenue', 'Enterprise License - Acme Corp',   62000,  'Licensing',   'Settled', '2025-01-05'),
  ('Expense', 'AWS Infrastructure',             -12400,  'Technology',  'Settled', '2025-01-15'),
  ('Revenue', 'Consulting Services - Beta Inc',   45000,  'Services',    'Pending', '2025-01-20'),
  ('Expense', 'Marketing Campaign Q1',           -22000,  'Marketing',   'Pending', '2025-02-01'),
  ('Revenue', 'SaaS Subscriptions - Feb',         91200,  'Sales',       'Settled', '2025-02-15'),
  ('Expense', 'Payroll - February',            -132000,  'Operations',  'Settled', '2025-02-28'),
  ('Revenue', 'Professional Services',            38000,  'Services',    'Pending', '2025-03-01');

-- Inventory
INSERT INTO inventory (name, sku, category, quantity, price, reorder_point, supplier, status) VALUES
  ('MacBook Pro M3 16"',       'MBP-M3-16',    'Hardware',    24,   2499.00, 10, 'Apple Inc.',    'In Stock'),
  ('Dell 27" Monitor U2723D',  'DEL-U2723D',   'Hardware',     8,    549.00, 15, 'Dell Tech',     'Low Stock'),
  ('GitHub Enterprise (seat)', 'GH-ENT-Y',     'Software',   150,     21.00, 50, 'GitHub',        'In Stock'),
  ('Ergonomic Chair - Aeron',  'CHAIR-ERG1',   'Furniture',    0,    890.00,  5, 'Herman Miller', 'Out of Stock'),
  ('Logitech MX Master 3S',    'LOG-MXM3S',    'Peripherals', 42,     99.00, 20, 'Logitech',      'In Stock'),
  ('USB-C Hub 12-in-1',        'USB-HUB12',    'Peripherals',  5,     79.00, 15, 'Anker',         'Low Stock'),
  ('Slack Business+ (seat)',   'SLACK-BIZ',    'Software',   200,     12.50,100, 'Salesforce',    'In Stock'),
  ('Standing Desk - Pro',      'DESK-STAND1',  'Furniture',   12,    650.00,  5, 'Autonomous',    'In Stock');
