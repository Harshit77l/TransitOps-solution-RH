import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Pull a readable message out of a DRF error response.
export function apiError(error, fallback = "Something went wrong.") {
  const d = error?.response?.data;
  if (!d) return fallback;
  if (Array.isArray(d)) return d.join(" ");
  if (typeof d === "string") return d;
  if (d.detail) return d.detail;
  const first = Object.values(d)[0];
  return Array.isArray(first) ? first.join(" ") : String(first || fallback);
}
