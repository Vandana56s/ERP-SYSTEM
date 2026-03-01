// ============================================================
// src/utils/format.js
// Shared formatting utility functions
// ============================================================

// Format number as currency
// 120000  → $120K
// 1500000 → $1.5M
// 500     → $500
export function fmtCurrency(n) {
  if (n == null) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toLocaleString()}`;
}

// Format date string to readable format
// '2025-01-15' → 'Jan 15, 2025'
export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format percentage
// fmtPercent(25, 100) → '25%'
export function fmtPercent(a, b) {
  if (!b) return "0%";
  return `${Math.round((a / b) * 100)}%`;
}
