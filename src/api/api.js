// Deprecated standalone API instance: migrate to axiosInstance (which already
// sets baseURL to <backend>/api and attaches Authorization from localStorage).
// Keep a thin re-export for legacy imports to avoid breaking existing code.
import axiosInstance from "../axiosInstance";

export default axiosInstance;
