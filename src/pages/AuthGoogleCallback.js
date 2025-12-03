import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthGoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        localStorage.setItem("token", token);
        // Optionally, fetch user profile later to hydrate UI
      }
    } catch {}
    // Redirect to home after processing
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
}
