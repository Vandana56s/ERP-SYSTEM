// ============================================================
// src/hooks/usePermission.js
// Convenience hook for RBAC checks in components
//
// Usage:
//   const { can } = usePermission();
//   if (can('finance')) { show edit button }
// ============================================================

import { useAuth } from "../context/AuthContext";

export function usePermission() {
  const { hasPermission, user } = useAuth();
  return { can: hasPermission, user };
}
