import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash, FaArrowRight, FaUser, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { FiMail, FiLock, FiShield, FiTrendingUp, FiUsers, FiTarget } from 'react-icons/fi';
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuthUser } = useAuth();

  useEffect(() => {
    // Debounced single status check to avoid hammering rate limiter; ignore 429
    let cancelled = false;
    const checkSession = async () => {
      try {
        const res = await axiosInstance.get("/auth/status");
        if (!cancelled && res.data.loggedIn && res.data.type === "user") {
          navigate("/");
        } else if (!cancelled && res.data.loggedIn && res.data.type === "company") {
          setError("You are logged in as a company. Please log out first.");
          setTimeout(() => navigate("/company/logout"), 2000);
        }
      } catch (err) {
        if (err?.response?.status === 429) {
          console.info("Login status check rate-limited; will retry later if needed.");
        } else {
          console.warn("No active user session.");
        }
      }
    };
    // Slight delay to batch with AuthContext initial call
    const timer = setTimeout(checkSession, 300);
    return () => { cancelled = true; clearTimeout(timer); };

    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    if (errorParam === "UserNotRegistered") {
      setError("User not registered. Please register first.");
      setTimeout(() => navigate("/register"), 2000);
    } else if (errorParam === "UserDeactivated") {
      setError("Your account has been deactivated. Please contact support.");
    }
    const verified = params.get("verified");
    if (verified === "true") {
      setInfo("Your email has been successfully verified. Please log in.");
    }
  }, [location, navigate]);

  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => {
    // Discover auth options (Google availability) to avoid redirect errors
    const fetchOptions = async () => {
      try {
        const { data } = await axiosInstance.get("/auth/options");
        setGoogleEnabled(Boolean(data.google));
      } catch (err) {
        if (err?.response?.status === 429) {
          // Backoff + retry once after 2s
          setTimeout(async () => {
            try {
              const { data: retryData } = await axiosInstance.get("/auth/options");
              setGoogleEnabled(Boolean(retryData.google));
            } catch {
              setGoogleEnabled(false);
            }
          }, 2000);
        } else {
          setGoogleEnabled(false);
        }
      }
    };
    fetchOptions();
  }, []);

  const handleGoogleLogin = () => {
    if (!googleEnabled) {
      setError("Google OAuth not configured.");
      return;
    }
    setLoading(true);
    window.location.href = `${process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000"}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/auth/login", formData);
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        // Immediately update global auth context so header/nav reflects logged-in state
        setAuthUser(data.user);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col lg:flex-row relative z-10"
      >
        {/* Left Side: Enhanced Features and Info */}
        <div className="lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-8 lg:p-12 text-white flex flex-col justify-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FiTarget className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                WorkSphere
              </h1>
            </div>
            <p className="text-lg opacity-90 font-medium mb-8">Your gateway to premium career opportunities</p>

            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FiTrendingUp className="mr-3 text-yellow-300" />
              Why Choose WorkSphere?
            </h2>

            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-start group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                  <FaCheckCircle className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Exclusive Job Access</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Access thousands of premium job listings from Fortune 500 companies and innovative startups.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-start group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                  <FiUsers className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Direct Connections</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Connect directly with hiring managers and recruiters from top-tier companies.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex items-start group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                  <FiShield className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">AI-Powered Matching</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Receive personalized job recommendations tailored to your skills and career goals.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="flex items-start group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                  <FaCheckCircle className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Secure & Private</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Enterprise-grade security with complete privacy control over your professional data.</p>
                </div>
              </motion.div>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-8 pt-6 border-t border-white/20"
            >
              <div className="flex items-center space-x-6 text-sm opacity-75">
                <div className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-300 mr-2" />
                  <span>500K+ Active Users</span>
                </div>
                <div className="flex items-center">
                  <FaCheckCircle className="w-4 h-4 text-green-300 mr-2" />
                  <span>10K+ Companies</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        {/* Right Side: Enhanced Form */}
        <div className="lg:w-1/2 p-8 lg:p-12 bg-white">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600 text-lg">
                Sign in to your account to continue your journey
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
                >
                  Create one now
                </Link>
              </p>
            </div>

            {/* Enhanced Message Display */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start space-x-3"
                >
                  <FaExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Sign In Failed</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </motion.div>
              )}

              {info && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl flex items-start space-x-3"
                >
                  <FaInfoCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Information</p>
                    <p className="text-sm opacity-90">{info}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6" aria-label="Login Form">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm bg-gray-50/50 focus:bg-white"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm bg-gray-50/50 focus:bg-white"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded focus:ring-2"
                    disabled={loading}
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 font-medium">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed shadow-none' : 'shadow-indigo-500/25 hover:shadow-indigo-500/40'}`}
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing you in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign In to WorkSphere</span>
                    <FaArrowRight className="w-4 h-4" />
                  </div>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading || !googleEnabled}
              className={`w-full flex items-center justify-center px-6 py-4 border-2 rounded-xl shadow-sm text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                googleEnabled
                  ? 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-gray-100 hover:shadow-gray-200'
                  : 'border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <FcGoogle className="h-5 w-5 mr-3" />
              {googleEnabled ? 'Continue with Google' : 'Google OAuth Unavailable'}
            </motion.button>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium underline decoration-2 underline-offset-2">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium underline decoration-2 underline-offset-2">
                    Privacy Policy
                  </a>
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                  <span>🔒 Secure & Encrypted</span>
                  <span>•</span>
                  <span>🛡️ Privacy First</span>
                </div>
                <p className="text-xs text-gray-400">
                  © {new Date().getFullYear()} WorkSphere. All rights reserved.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;