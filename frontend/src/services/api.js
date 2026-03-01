// ============================================================
// src/services/api.js
// Centralized API layer using Axios.
//
// KEY FEATURES:
//   1. Base URL configured once here
//   2. Request interceptor: auto attaches JWT to every request
//   3. Response interceptor: auto refreshes expired tokens
// ============================================================

import axios from "axios";

const BASE_URL = "/api";

// Create Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ── REQUEST INTERCEPTOR
// Attach the access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── RESPONSE INTERCEPTOR
// If API returns 401 (token expired), try to refresh automatically
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem("accessToken", data.accessToken);
        api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ============================================================
// API FUNCTIONS
// ============================================================

// AUTH
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  logout: (data) => api.post("/auth/logout", data),
  refresh: (data) => api.post("/auth/refresh", data),
  me: () => api.get("/auth/me"),
};

// EMPLOYEES
export const employeeAPI = {
  getAll: (params) => api.get("/employees", { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post("/employees", data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  stats: () => api.get("/employees/stats"),
};

// FINANCE
export const financeAPI = {
  getAll: (params) => api.get("/finance", { params }),
  create: (data) => api.post("/finance", data),
  update: (id, data) => api.put(`/finance/${id}`, data),
  delete: (id) => api.delete(`/finance/${id}`),
  stats: () => api.get("/finance/stats"),
};

// INVENTORY
export const inventoryAPI = {
  getAll: (params) => api.get("/inventory", { params }),
  create: (data) => api.post("/inventory", data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  restock: (id, qty) =>
    api.patch(`/inventory/${id}/restock`, { quantity: qty }),
  stats: () => api.get("/inventory/stats"),
};

// ANALYTICS
export const analyticsAPI = {
  dashboard: () => api.get("/analytics/dashboard"),
};

export default api;
