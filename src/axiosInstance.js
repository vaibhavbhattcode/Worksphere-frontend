import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Attach JWT token from localStorage to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if this is an admin request
    const isAdminRequest = config.url?.includes('/admin');
    
    if (isAdminRequest) {
      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) {
        config.headers["Authorization"] = `Bearer ${adminToken}`;
      }
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAdminRequest = error.config?.url?.includes('/admin');
    
    // If unauthorized or forbidden on admin routes, clear admin session
    if (isAdminRequest && (error.response?.status === 401 || error.response?.status === 403)) {
      console.log("Admin authentication failed - clearing session");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      
      // Redirect to admin login if not already there
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
