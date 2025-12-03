import axiosInstance from "../axiosInstance";

// Extend shared axiosInstance for admin token injection without duplicating configuration.
axiosInstance.interceptors.request.use((config) => {
  if (config.url && config.url.includes("/admin")) {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  }
  return config;
});

export const api = axiosInstance;
