// ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";

const ProtectedRoute = ({ children, type = "user" }) => {
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const url = type === "user" ? "/auth/status" : "/company/auth/status";
        console.log(`[ProtectedRoute] Checking ${type} auth at ${url}`);
        
        const token = localStorage.getItem("token");
        console.log(`[ProtectedRoute] Token in localStorage:`, token ? "present" : "missing");
        
        const response = await axiosInstance.get(url);
        console.log(`[ProtectedRoute] Auth response:`, response.data);
        
        if (response.data.loggedIn && response.data.type === type) {
          console.log(`[ProtectedRoute] ✅ Authenticated as ${type}`);
          setAuthStatus("authenticated");
        } else {
          console.log(`[ProtectedRoute] ❌ Not authenticated. Expected type: ${type}, Got:`, response.data);
          setAuthStatus("unauthenticated");
        }
      } catch (error) {
        console.error(`[ProtectedRoute] ❌ Error checking ${type} auth:`, error?.message || error);
        setAuthStatus("unauthenticated");
      }
    };
    checkAuth();
  }, [type]);

  if (authStatus === null) return <div>Loading...</div>;
  if (authStatus === "authenticated") return children;

  const redirectTo = type === "user" ? "/login" : "/company/login";
  return <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
