// CompanyVerifyEmail.js - Professional Email Verification
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { emailRegex } from "../utils/validation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaArrowLeft,
  FaMailBulk,
  FaShieldAlt,
  FaClock,
  FaBuilding,
  FaRedo
} from "react-icons/fa";

const RESEND_TIMEOUT = 60; // seconds

const CompanyVerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email =
    location.state?.email ||
    new URLSearchParams(window.location.search).get("email");
  const verified = new URLSearchParams(window.location.search).get("verified");
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(RESEND_TIMEOUT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (verified) {
      setMessage("Your email has been verified! Redirecting to login...");
      setTimeout(() => navigate("/company/login"), 3000);
    } else {
      setMessage(
        `A verification email has been sent to ${email}. Please check your inbox and click the verification link.`
      );
      setTimer(RESEND_TIMEOUT);
    }
  }, [verified, email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleResend = async () => {
    setLoading(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!emailRegex.test(cleanEmail)) {
        setMessage("Please provide a valid email to resend the verification.");
        setLoading(false);
        return;
      }
      await axiosInstance.post("/company/auth/resend-verification", { email: cleanEmail });
      setMessage("Verification email resent successfully! Please check your inbox.");
      setTimer(RESEND_TIMEOUT);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to resend verification email. Please try again.");
    }
    setLoading(false);
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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
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
          variants={cardVariants}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <FaEnvelope className="w-8 h-8 text-white" />
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
              {verified ? "Email Verified!" : "Verify Your Email"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {verified ? "Welcome to WorkSphere!" : "Complete your registration"}
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Success Message */}
            <AnimatePresence>
              {verified && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-6 rounded-xl flex items-start space-x-3"
                >
                  <FaCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Email Verified Successfully!</p>
                    <p className="text-sm mt-1">{message}</p>
                    <div className="flex items-center space-x-2 mt-3 text-sm text-green-600 dark:text-green-400">
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Redirecting to login...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verification Pending Message */}
            <AnimatePresence>
              {!verified && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-6 rounded-xl"
                >
                  <div className="flex items-start space-x-3">
                    <FaMailBulk className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-2">Verification Email Sent</p>
                      <p className="text-sm">{message}</p>
                      <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                        Didn't receive the email? Check your spam folder or click below to resend.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resend Button */}
            <AnimatePresence>
              {!verified && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleResend}
                    disabled={loading || timer > 0}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                      loading || timer > 0
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : timer > 0 ? (
                      <>
                        <FaClock className="w-4 h-4" />
                        <span>Resend in {timer}s</span>
                      </>
                    ) : (
                      <>
                        <FaRedo className="w-4 h-4" />
                        <span>Resend Verification Email</span>
                      </>
                    )}
                  </motion.button>

                  {/* Timer Info */}
                  {timer > 0 && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Please wait {timer} seconds before requesting another email
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Help Information */}
            <AnimatePresence>
              {!verified && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-start space-x-3">
                    <FaShieldAlt className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        Email Verification Help
                      </p>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <p>• Check your spam/junk folder</p>
                        <p>• Add our email to your contacts</p>
                        <p>• Verification links expire in 24 hours</p>
                        <p>• Make sure you're checking the correct email</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <button
                onClick={() => navigate("/company/login")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
              >
                {verified ? "Continue to Login" : "Back to Login"}
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

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 mb-2">
              <FaBuilding className="w-4 h-4" />
              <span className="text-sm font-semibold">Why Verify Your Email?</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Email verification ensures the security of your account and helps us provide you with important updates about your job postings and applications.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CompanyVerifyEmail;
