// ...existing code...
import axios from "axios";

function normalizeApiUrl(raw?: string) {
  if (!raw) return "http://localhost:8000/api";
  // quitar slashes finales y quitar '/api' si ya lo trae, luego añadir '/api'
  let v = String(raw).trim();
  v = v.replace(/\/+$/, "");
  v = v.replace(/\/api$/i, "");
  return v + "/api";
}

export const BASE_API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL as string | undefined);

const api = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const products = {
  list: () => api.get("/products/").then((r) => r.data),
  get: (id: number) => api.get(`/products/${id}/`).then((r) => r.data),
  create: (payload: any) => api.post("/products/", payload).then((r) => r.data),
  update: (id: number, payload: any) => api.put(`/products/${id}/`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/products/${id}/`).then((r) => r.data),
};

export const sales = {
  list: (params?: any) => api.get("/sales/", { params }).then((r) => r.data),
  create: (payload: any) => api.post("/sales/", payload).then((r) => r.data),
};

export const authApi = {
  setRecoveryEmail: (payload: { email: string }) => api.post("/auth/set_recovery_email", payload).then((r) => r.data),
  verifyRecoveryEmail: (token: string) => api.post("/auth/verify_recovery_email", { token }).then((r) => r.data),
  requestPasswordReset: (payload: { email: string }) => api.post("/auth/request_password_reset", payload).then((r) => r.data),
  // <-- NEW: request by username
  requestPasswordResetByUsername: (payload: { username: string }) =>
    api.post("/auth/request_password_reset_by_username", payload).then((r) => r.data),
  performPasswordReset: (payload: { token: string; new_password: string }) =>
    api.post("/auth/perform_password_reset", payload).then((r) => r.data),
};

export const archiveApi = {
  listBatches: () => api.get("/archive/batches").then((r) => r.data),
  batchDetail: (id: string) => api.get(`/archive/batches/${encodeURIComponent(id)}`).then((r) => r.data),
  runArchive: (batchSize?: number) => {
    const qs = typeof batchSize === "number" ? `?batch_size=${batchSize}` : "";
    return api.post(`/archive/run${qs}`).then((r) => r.data);
  },
  deleteBatch: (id: string) => api.delete(`/archive/batches/${encodeURIComponent(id)}`).then((r) => r.data),
  clearAll: (confirm = false) => api.delete("/archive/batches", { params: { confirm } }).then((r) => r.data),
  metrics: (period: "day" | "week" | "month" = "day") => api.get("/archive/metrics", { params: { period } }).then((r) => r.data),
  metricsSeries: (period: "day" | "week" | "month" = "day", last = 30) => api.get("/archive/metrics/series", { params: { period, last } }).then((r) => r.data),
  summaryTotals: (start?: string, end?: string) => api.get("/archive/summary/totals", { params: { start, end } }).then((r) => r.data),
};

export default api;
// ...existing code...