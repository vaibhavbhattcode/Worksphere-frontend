import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash, FaArrowRight, FaCheckCircle, FaExclamationTriangle, FaUser, FaShieldAlt, FaRocket, FaUsers } from "react-icons/fa";
import { FiUser, FiMail, FiLock, FiTrendingUp, FiTarget, FiAward } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../axiosInstance";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email address";
    if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert("");
    setErrors({});
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(
        "/auth/register",
        { name: formData.name, email: formData.email, password: formData.password }
      );
      setAlert(res.data.message);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setErrors({
        api: err.response?.data?.message || "Registration failed",
      });
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    window.location.href = `${process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000"}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col lg:flex-row relative z-10"
      >
        {/* Left Side: Enhanced Features and Info */}
        <div className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 lg:p-12 text-white flex flex-col justify-center relative overflow-hidden">
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
                <FaRocket className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                WorkSphere
              </h1>
            </div>
            <p className="text-lg opacity-90 font-medium mb-8">Start your journey to career success</p>

            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FiAward className="mr-3 text-yellow-300" />
              Why Join WorkSphere Today?
            </h2>

            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-start group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                  <FiTarget className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Smart Job Matching</h3>
                  <p className="text-sm opacity-80 leading-relaxed">AI-powered recommendations that match your skills with the perfect opportunities.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-start group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                  <FiTrendingUp className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Career Growth Tools</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Resume builder, skill assessments, and career guidance to accelerate your progress.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex items-start group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                  <FaUsers className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Professional Network</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Connect with industry professionals, mentors, and like-minded career seekers.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="flex items-start group"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1 group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                  <FaShieldAlt className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Secure & Trusted</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Bank-level security with verified companies and transparent processes.</p>
                </div>
              </motion.div>
            </div>

            {/* Success metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-8 pt-6 border-t border-white/20"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50K+</div>
                  <div className="text-sm opacity-75">Jobs Posted Monthly</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-sm opacity-75">Success Rate</div>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600 text-lg">
                Join thousands of professionals finding their dream careers
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Enhanced Message Display */}
            <AnimatePresence mode="wait">
              {alert && (
                <motion.div
                  key="alert"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start space-x-3"
                >
                  <FaCheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Registration Successful!</p>
                    <p className="text-sm opacity-90">{alert}</p>
                  </div>
                </motion.div>
              )}

              {errors.api && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start space-x-3"
                >
                  <FaExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Registration Failed</p>
                    <p className="text-sm opacity-90">{errors.api}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign Up */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 mb-6 shadow-gray-100 hover:shadow-gray-200"
            >
              <FcGoogle className="h-5 w-5 mr-3" />
              Continue with Google
            </motion.button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or register with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" aria-label="Register Form">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    aria-label="Full Name"
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm bg-gray-50/50 focus:bg-white"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={loading}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-2 flex items-center"
                    >
                      <FaExclamationTriangle className="w-3 h-3 mr-1" />
                      {errors.name}
                    </motion.p>
                  )}
                </div>
              </div>

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
                    placeholder="Enter your email address"
                    required
                    aria-label="Email Address"
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm bg-gray-50/50 focus:bg-white"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-2 flex items-center"
                    >
                      <FaExclamationTriangle className="w-3 h-3 mr-1" />
                      {errors.email}
                    </motion.p>
                  )}
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
                    placeholder="Create a strong password"
                    required
                    aria-label="Password"
                    className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm bg-gray-50/50 focus:bg-white"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-500 text-xs">At least 8 characters required</p>
                  {formData.password.length >= 8 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center text-emerald-600 text-xs"
                    >
                      <FaCheckCircle className="w-3 h-3 mr-1" />
                      Strong password
                    </motion.div>
                  )}
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-2 flex items-center"
                  >
                    <FaExclamationTriangle className="w-3 h-3 mr-1" />
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                    aria-label="Confirm Password"
                    className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm bg-gray-50/50 focus:bg-white"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center text-emerald-600 text-xs mt-2"
                  >
                    <FaCheckCircle className="w-3 h-3 mr-1" />
                    Passwords match
                  </motion.div>
                )}
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-2 flex items-center"
                  >
                    <FaExclamationTriangle className="w-3 h-3 mr-1" />
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </div>

              {/* Create Account Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed shadow-none' : 'shadow-emerald-500/25 hover:shadow-emerald-500/40'}`}
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating your account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Start Your Career Journey</span>
                    <FaArrowRight className="w-4 h-4" />
                  </div>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium underline decoration-2 underline-offset-2">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium underline decoration-2 underline-offset-2">
                    Privacy Policy
                  </a>
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                  <span>🔒 Enterprise Security</span>
                  <span>•</span>
                  <span>🛡️ GDPR Compliant</span>
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

export default Register;