// CompanyResetPassword.js - Professional Password Reset
import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { passwordSchema, confirmPasswordSchema } from "../utils/validation";
import axiosInstance from "../axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaArrowLeft,
  FaShieldAlt,
  FaKey,
  FaCheck,
  FaTimes
} from "react-icons/fa";

const CompanyResetPassword = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const email = params.get("email");

  const initialValues = {
    password: "",
    confirmPassword: "",
  };

  // Enhanced validation schema
  const validationSchema = Yup.object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  });

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const payload = {
        token,
        email: email?.trim().toLowerCase(),
        password: values.password.trim(),
      };
      const res = await axiosInstance.post("/company/auth/reset-password", payload);
      setMessage(res.data.message || "Password reset successful");
      resetForm();

      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/company/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
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
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 overflow-hidden py-8"
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
              <FaKey className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
              WorkSphere
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enterprise Job Portal
            </p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Create a new strong password for your account
            </p>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 flex items-start space-x-3"
              >
                <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Password Reset Successful!</p>
                  <p className="text-sm">{message}</p>
                  <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                    You will be redirected to the login page shortly...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 flex items-start space-x-3"
              >
                <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Reset Failed</p>
                  <p className="text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset Password Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => {
              const strength = checkPasswordStrength(values.password);

              return (
                <Form className="space-y-6">
                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaLock className="w-4 h-4 text-gray-400" />
                      </div>
                      <Field
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className={`w-full pl-12 pr-12 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                          errors.password && touched.password
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                        onChange={(e) => {
                          setFieldValue("password", e.target.value);
                          setPasswordStrength(checkPasswordStrength(e.target.value));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {values.password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Password Strength:</span>
                          <span className={`font-medium ${
                            strength < 3 ? 'text-red-600' :
                            strength < 4 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {strength < 3 ? 'Weak' : strength < 4 ? 'Medium' : 'Strong'}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                level <= strength
                                  ? strength < 3 ? 'bg-red-400' :
                                    strength < 4 ? 'bg-yellow-400' : 'bg-green-400'
                                  : 'bg-gray-200 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                    >
                      <span>⚠</span>
                      <span>{errors.password}</span>
                    </ErrorMessage>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaLock className="w-4 h-4 text-gray-400" />
                      </div>
                      <Field
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        className={`w-full pl-12 pr-12 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                          errors.confirmPassword && touched.confirmPassword
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                      </button>
                    </div>
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                    >
                      <span>⚠</span>
                      <span>{errors.confirmPassword}</span>
                    </ErrorMessage>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <FaKey className="w-4 h-4" />
                        <span>Reset Password</span>
                      </>
                    )}
                  </motion.button>
                </Form>
              );
            }}
          </Formik>

          {/* Navigation Links */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <button
                onClick={() => navigate("/company/login")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                Back to Sign In
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

          {/* Security Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <FaShieldAlt className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Password Requirements
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                  <div className="flex items-center space-x-2">
                    <FaCheck className="w-3 h-3" />
                    <span>At least 12 characters long</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaCheck className="w-3 h-3" />
                    <span>One uppercase & lowercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaCheck className="w-3 h-3" />
                    <span>One number & special character</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CompanyResetPassword;
