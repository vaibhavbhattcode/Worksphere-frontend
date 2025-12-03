import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // "user" or null
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage and validate token once on app load
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Hydrate from cache first for fast paint
        const storedUser = localStorage.getItem("user");
        const storedCompany = localStorage.getItem("company");
        
        // Set initial state from localStorage (optimistic); will reconcile after server checks
        let cachedUser = storedUser ? JSON.parse(storedUser) : null;
        let cachedCompany = storedCompany ? JSON.parse(storedCompany) : null;
        if (cachedUser) {
          setUser(cachedUser);
          setUserType("user");
        } else if (cachedCompany) {
          setUser(cachedCompany);
          setUserType("company");
        }

        // Check user auth status
        try {
          const userRes = await axiosInstance.get("/auth/status");
          if (userRes.data?.loggedIn && userRes.data?.type === "user") {
            setUserType("user");
            // Always fetch profile to avoid stale / mismatched IDs for sockets
            try {
              const prof = await axiosInstance.get("/user/profile");
              if (prof?.data) {
                let normalized = { ...prof.data };
                // If profile _id is a UserProfile id and actual user id is in 'user', normalize
                if (normalized.user && normalized._id && normalized.user !== normalized._id) {
                  console.log('AuthContext: Normalizing profile document id to user id');
                  normalized._id = normalized.user; // set authoritative user id
                }
                // Remove duplicate field if desired
                // Keep 'user' for debugging but ensure _id is correct for socket registration
                if (!cachedUser || cachedUser._id !== normalized._id) {
                  console.log('AuthContext: Updating cached user after normalization');
                  setUser(normalized);
                  localStorage.setItem("user", JSON.stringify(normalized));
                } else {
                  localStorage.setItem("user", JSON.stringify(normalized));
                  setUser(normalized);
                }
              }
            } catch (profileErr) {
              console.warn('AuthContext: Failed to refresh user profile', profileErr?.message || profileErr);
            }
            setLoading(false);
            return;
          }
        } catch (_userErr) {
          // If user auth fails, try company auth
        }

        // Check company auth status
        try {
          const companyRes = await axiosInstance.get("/company/auth/status");
          if (companyRes.data?.loggedIn && companyRes.data?.type === "company") {
            setUserType("company");
            // Always reconcile company profile to prevent socket ID mismatch
            if (companyRes.data?.company) {
              let freshCompany = { ...companyRes.data.company };
              // If there's a pattern similar to user profiles (company profile id vs company id) normalize
              if (freshCompany.company && freshCompany._id && freshCompany.company !== freshCompany._id) {
                console.log('AuthContext: Normalizing company profile document id to company id');
                freshCompany._id = freshCompany.company;
              }
              if (!cachedCompany || cachedCompany._id !== freshCompany._id) {
                console.log('AuthContext: Updating cached company profile after normalization');
                setUser(freshCompany);
                localStorage.setItem("company", JSON.stringify(freshCompany));
              } else {
                localStorage.setItem("company", JSON.stringify(freshCompany));
                setUser(freshCompany);
              }
            }
            setLoading(false);
            return;
          }
        } catch (_companyErr) {
          // If company auth also fails, not authenticated
        }

        // Not authenticated as either user or company
        setUser(null);
        setUserType(null);
      } catch (error) {
        // Treat rate-limit (429) or transient network errors as neutral: keep existing session
        if (error?.response?.status === 429) {
          console.warn("Auth status rate-limited; preserving existing auth state.");
        } else {
          setUser(null);
          setUserType(null);
        }
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  // Login and logout helpers
  const login = (userData) => {
    // Ensure token already stored by caller; we optimistically set state for instant UI update
    setUserType("user");
    setUser(userData);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    // Mark loading false if we were still hydrating to avoid stale spinner in header
    setLoading(false);
  };
  const logout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, userType, loading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
