import axios from "axios";

const configuredBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const normalizedBase = configuredBase.endsWith("/api")
  ? configuredBase
  : `${configuredBase.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL: normalizedBase,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const rawToken = window.localStorage.getItem("token");
  const token =
    rawToken && rawToken !== "undefined" && rawToken !== "null" ? rawToken : "";

  if (rawToken && !token) {
    window.localStorage.removeItem("token");
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
