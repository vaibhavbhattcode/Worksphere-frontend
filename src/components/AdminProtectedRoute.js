import React from "react";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  console.log("AdminProtectedRoute: Validating admin token and user");
  const adminToken = localStorage.getItem("adminToken");
  console.log("AdminProtectedRoute: Token:", adminToken ? "Present" : "Missing");
  
  if (!adminToken) {
    console.log("AdminProtectedRoute: No token found, redirecting to login");
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    return <Navigate to="/admin/login" replace />;
  }

  // Check token expiration
  try {
    const tokenParts = adminToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error("Invalid token format");
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    
    if (Date.now() >= expirationTime) {
      console.log("AdminProtectedRoute: Token expired, redirecting to login");
      localStorage.removeItem("admin");
      localStorage.removeItem("adminToken");
      return <Navigate to="/admin/login" replace />;
    }
  } catch (error) {
    console.error("AdminProtectedRoute: Error validating token", error);
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    return <Navigate to="/admin/login" replace />;
  }

  const admin = JSON.parse(localStorage.getItem("admin"));
  console.log("AdminProtectedRoute: Admin:", admin);

  if (!admin || admin.isAdmin !== true) {
    console.log(
      "AdminProtectedRoute: Invalid or missing isAdmin field, redirecting to login"
    );
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
