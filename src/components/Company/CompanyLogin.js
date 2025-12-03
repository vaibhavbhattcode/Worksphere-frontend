// CompanyLogin.js - Enhanced Professional Company Authentication
import React, { useEffect, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { emailSchema } from "../../utils/validation";
import axiosInstance from "../../axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaBuilding,
  FaClock,
  FaArrowLeft
} from "react-icons/fa";

const RESEND_TIMEOUT = 60; // seconds

const CompanyLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const verified = new URLSearchParams(location.search).get("verified");
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");
  const [resendError, setResendError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [showResendSection, setShowResendSection] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef();

  const initialValues = { email: "", password: "" };

  // Enhanced validation schema with professional requirements
  const validationSchema = Yup.object({
    email: emailSchema,
    password: Yup.string()
      .transform((v) => (typeof v === 'string' ? v.trim() : v))
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters")
      .required("Password is required"),
  });

  // Check authentication status
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axiosInstance.get("/company/auth/status");
        if (res.data.loggedIn && res.data.type === "company") {
          navigate("/company");
        }
      } catch (err) {
        // No active session; continue with login
      }
    };
    checkSession();
  }, [navigate]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Handle resend verification email
  const handleResendVerification = async (email) => {
    setResendLoading(true);
    setResendSuccess("");
    setResendError("");

    try {
  await axiosInstance.post("/company/auth/resend-verification", { email });
      setResendSuccess("Verification email resent successfully! Please check your inbox.");
      setShowResend(false);
      setResendTimer(RESEND_TIMEOUT);

      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setShowResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setResendError(
        error.response?.data?.message || "Failed to resend verification email. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setIsLoading(true);
    setResendSuccess("");
    setResendError("");
    setLoginError("");

    try {
      const payload = {
        email: values.email.trim().toLowerCase(),
        password: values.password.trim(),
      };
      const response = await axiosInstance.post("/company/auth/login", payload);
      
      console.log("Login response:", response.data);
      
      // Extract token from response.data.data (backend uses apiResponse wrapper)
      const { token, company } = response.data.data || {};
      
      if (token) {
        // Use the same key so axiosInstance will attach it to subsequent requests
        localStorage.setItem("token", token);
        localStorage.setItem("companyToken", token);
        console.log("Token saved to localStorage:", token.substring(0, 20) + "...");
      } else {
        console.error("No token in response!");
      }
      
      if (company) {
        localStorage.setItem("company", JSON.stringify(company));
        console.log("Company data saved to localStorage");
      }
      
      // Add a small delay to ensure localStorage is written before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("Navigating to /company");
      navigate("/company", { replace: true });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";

      if (errorMessage.toLowerCase().includes("verify your email")) {
        setShowResendSection(true);
        setLoginError(errorMessage);
      } else {
        setShowResendSection(false);
        setLoginError(errorMessage);
      }

      // Set field-specific errors if available
      if (error.response?.data?.field) {
        setErrors({ [error.response.data.field]: errorMessage });
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, delay: 0.2 }
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400 to-cyan-600 rounded-full opacity-20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full opacity-10 blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <motion.div
          variants={formVariants}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <FaBuilding className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
              WorkSphere
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enterprise Job Portal
            </p>
          </div>

          {/* Verification Success Message */}
          <AnimatePresence>
            {verified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 flex items-center space-x-3"
              >
                <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Email Verified Successfully!</p>
                  <p className="text-sm">You can now log in to your company account.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-6">
                {/* Error Messages */}
                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-xl flex items-start space-x-3"
                    >
                      <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Login Failed</p>
                        <p className="text-sm">{loginError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Business Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="w-4 h-4 text-gray-400" />
                    </div>
                    <Field
                      name="email"
                      type="email"
                      placeholder="company@domain.com"
                      className={`w-full pl-12 pr-4 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.email && touched.email
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                    />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                  >
                    <span>⚠</span>
                    <span>Please enter a valid business email address</span>
                  </ErrorMessage>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaLock className="w-4 h-4 text-gray-400" />
                    </div>
                    <Field
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className={`w-full pl-12 pr-12 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.password && touched.password
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                  >
                    <span>⚠</span>
                    <span>Password is required</span>
                  </ErrorMessage>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <FaShieldAlt className="w-4 h-4" />
                      <span>Sign In Securely</span>
                    </>
                  )}
                </motion.button>

                {/* Resend Verification Section */}
                <AnimatePresence>
                  {showResendSection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
                    >
                      <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                        <FaCheckCircle className="w-4 h-4" />
                        <span className="font-semibold text-sm">Email Verification Required</span>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const emailField = document.querySelector('input[name="email"]');
                          if (emailField && emailField.value) {
                            await handleResendVerification(emailField.value);
                          }
                        }}
                        disabled={resendLoading || resendTimer > 0}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                          resendLoading || resendTimer > 0
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                        }`}
                      >
                        {resendLoading ? (
                          <>
                            <FaSpinner className="w-4 h-4 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : resendTimer > 0 ? (
                          <>
                            <FaClock className="w-4 h-4" />
                            <span>Resend in {resendTimer}s</span>
                          </>
                        ) : (
                          <span>Resend Verification Email</span>
                        )}
                      </button>

                      <AnimatePresence>
                        {resendSuccess && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-3 rounded-lg text-sm"
                          >
                            {resendSuccess}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {resendError && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm"
                          >
                            {resendError}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Form>
            )}
          </Formik>

          {/* Navigation Links */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => navigate("/company/forgot-password")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                Forgot Password?
              </button>
              <button
                onClick={() => navigate("/company/register")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                Create Company Account
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center w-full space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span>Back to Homepage</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CompanyLogin;
