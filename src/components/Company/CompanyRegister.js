// CompanyRegister.js - Professional Company Registration
import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { emailSchema, passwordSchema, confirmPasswordSchema, websiteSchema, sanitizeValues } from "../../utils/validation";
import LocationInput from "../LocationInput";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import axiosInstance from "../../axiosInstance";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaShieldAlt,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaStar,
  FaInfoCircle,
  FaUserCheck,
  FaBalanceScale
} from "react-icons/fa";

const CompanyRegister = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [industriesError, setIndustriesError] = useState(null);

  const initialValues = {
    companyName: "",
    email: "",
    phone: "",
    companyAddress: "",
    industry: "",
    website: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptPrivacy: false,
  };

  // Fetch industries from database
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setIndustriesLoading(true);
        setIndustriesError(null);

        const response = await axiosInstance.get("/industries");

        if (response.data && response.data.success && response.data.data) {
          setIndustries(response.data.data.map(industry => industry.name));
        } else {
          // Fallback to static options if API doesn't return expected format
          setIndustries([
            "Technology",
            "Healthcare",
            "Finance",
            "Education",
            "Manufacturing",
            "Retail",
            "Consulting",
            "Marketing",
            "Real Estate",
            "Transportation",
            "Energy",
            "Telecommunications",
            "Media & Entertainment",
            "Non-profit",
            "Government",
            "Other"
          ]);
        }
      } catch (error) {
        console.error("Error fetching industries:", error);
        setIndustriesError("Failed to load industries. Using default options.");

        // Fallback to static options
        setIndustries([
          "Technology",
          "Healthcare",
          "Finance",
          "Education",
          "Manufacturing",
          "Retail",
          "Consulting",
          "Marketing",
          "Real Estate",
          "Transportation",
          "Energy",
          "Telecommunications",
          "Media & Entertainment",
          "Non-profit",
          "Government",
          "Other"
        ]);
      } finally {
        setIndustriesLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  // Enhanced validation schema with professional requirements
  const validationSchema = Yup.object({
    companyName: Yup.string()
      .transform(v => v && v.trim())
      .min(2, "Company name must be at least 2 characters long")
      .max(100, "Company name cannot exceed 100 characters")
      .matches(/^[a-zA-Z0-9\s&.,'-]+$/, "Company name can only contain letters, numbers, spaces, and &.,'-")
      .required("Company name is required"),
    email: emailSchema,
    phone: Yup.string()
      .required('Phone number is required')
      .test('valid-phone', 'Please enter a valid phone number (with country code)', function (value) {
        if (!value) return false;
        try {
          const phone = parsePhoneNumberFromString("+" + value.replace(/\D/g, ""));
          return phone && phone.isValid();
        } catch {
          return false;
        }
      }),
    companyAddress: Yup.string()
      .transform(v => v && v.trim().replace(/\s+/g,' '))
      .min(10, "Address must be at least 10 characters long")
      .max(500, "Address cannot exceed 500 characters")
      .required("Company address is required"),
    industry: Yup.string()
      .transform(v => v && v.trim())
      .min(2, "Industry must be at least 2 characters long")
      .max(50, "Industry cannot exceed 50 characters")
      .required("Industry is required"),
    website: websiteSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    acceptTerms: Yup.boolean().oneOf([true], "You must accept the Terms of Service").required("You must accept the Terms of Service"),
    acceptPrivacy: Yup.boolean().oneOf([true], "You must accept the Privacy Policy").required("You must accept the Privacy Policy"),
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

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    setIsLoading(true);

    try {
      const cleaned = sanitizeValues(values);
      const payload = { ...cleaned, email: cleaned.email.toLowerCase() };
      const response = await axiosInstance.post(
        "/company/auth/register",
        payload
      );

      resetForm();
      navigate("/company/verify-email", {
        state: {
          email: payload.email,
          message: "Registration successful! Please check your email for verification."
        }
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";

      setErrors({
        apiError: errorMessage,
        ...(error.response?.data?.field && {
          [error.response.data.field]: errorMessage
        })
      });
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Phone number formatting
  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
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
      <div className="relative z-10 w-full max-w-2xl mx-4">
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

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Company Registration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Join thousands of companies already using WorkSphere
            </p>
          </div>

          {/* Registration Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => {
              const strength = checkPasswordStrength(values.password);

              return (
                <Form className="space-y-6">
                  {/* Error Messages */}
                  <AnimatePresence>
                    {errors.apiError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-xl flex items-start space-x-3"
                      >
                        <FaExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Registration Failed</p>
                          <p className="text-sm">{errors.apiError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Company Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-4">
                      <FaBuilding className="w-4 h-4" />
                      <span className="font-semibold text-sm">Company Information</span>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaBuilding className="w-4 h-4 text-gray-400" />
                        </div>
                        <Field
                          name="companyName"
                          type="text"
                          placeholder="Enter your company name"
                          className={`w-full pl-12 pr-4 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                            errors.companyName && touched.companyName
                              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                        />
                      </div>
                      <ErrorMessage
                        name="companyName"
                        component="div"
                        className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                      >
                        <span>⚠</span>
                        <span>{errors.companyName}</span>
                      </ErrorMessage>
                    </div>

                    {/* Email and Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Business Email <span className="text-red-500">*</span>
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
                          <span>{errors.email}</span>
                        </ErrorMessage>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaPhone className="w-4 h-4 text-gray-400" />
                          </div>
                          <Field name="phone">
                            {({ field, form }) => (
                              <PhoneInput
                                country={'us'}
                                value={field.value}
                                onChange={val => form.setFieldValue('phone', val)}
                                inputProps={{
                                  name: 'phone',
                                  required: true,
                                  autoFocus: false,
                                }}
                                inputClass={`w-full pl-12 pr-4 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                  errors.phone && touched.phone
                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                                specialLabel=""
                              />
                            )}
                          </Field>
                        </div>
                        <ErrorMessage
                          name="phone"
                          component="div"
                          className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                        >
                          <span>⚠</span>
                          <span>{errors.phone}</span>
                        </ErrorMessage>
                      </div>
                    </div>

                    {/* Address and Industry */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Industry <span className="text-red-500">*</span>
                        </label>
                        {industriesLoading ? (
                          <div className="flex items-center space-x-2 px-4 py-3.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700">
                            <FaSpinner className="w-4 h-4 animate-spin text-gray-400" />
                            <span className="text-gray-500 dark:text-gray-400">Loading industries...</span>
                          </div>
                        ) : industriesError ? (
                          <div className="flex items-center space-x-2 px-4 py-3.5 text-sm border border-yellow-300 dark:border-yellow-600 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                            <FaExclamationCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-yellow-700 dark:text-yellow-300">{industriesError}</span>
                          </div>
                        ) : (
                          <Field
                            as="select"
                            name="industry"
                            className={`w-full px-4 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                              errors.industry && touched.industry
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          >
                            <option value="">Select Industry</option>
                            {industries.map((industry) => (
                              <option key={industry} value={industry}>
                                {industry}
                              </option>
                            ))}
                          </Field>
                        )}
                        <ErrorMessage
                          name="industry"
                          component="div"
                          className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                        >
                          <span>⚠</span>
                          <span>{errors.industry}</span>
                        </ErrorMessage>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Website <span className="text-gray-400">(Optional)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaGlobe className="w-4 h-4 text-gray-400" />
                          </div>
                          <Field
                            name="website"
                            type="url"
                            placeholder="https://www.company.com"
                            className={`w-full pl-12 pr-4 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                              errors.website && touched.website
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500`}
                          />
                        </div>
                        <ErrorMessage
                          name="website"
                          component="div"
                          className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                        >
                          <span>⚠</span>
                          <span>{errors.website}</span>
                        </ErrorMessage>
                      </div>
                    </div>

                    {/* Company Address */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Company Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                        </div>
                        <Field name="companyAddress">
                          {({ field, form }) => (
                            <LocationInput
                              value={field.value}
                              onChange={val => form.setFieldValue('companyAddress', val)}
                              placeholder="123 Business Street, City, State, Country"
                              requireSelection={false}
                              className="pl-12 pr-4 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                            />
                          )}
                        </Field>
                      </div>
                      <ErrorMessage
                        name="companyAddress"
                        component="div"
                        className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-1"
                      >
                        <span>⚠</span>
                        <span>{errors.companyAddress}</span>
                      </ErrorMessage>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-4">
                      <FaShieldAlt className="w-4 h-4" />
                      <span className="font-semibold text-sm">Security Information</span>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Password <span className="text-red-500">*</span>
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

                    {/* Confirm Password */}
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
                          placeholder="Confirm your password"
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
                  </div>

                  {/* Terms and Privacy */}
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <Field
                        name="acceptTerms"
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                          I agree to the{" "}
                          <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Terms of Service
                          </a>{" "}
                          and understand the{" "}
                          <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Privacy Policy
                          </a>
                          <span className="text-red-500">*</span>
                        </label>
                        <ErrorMessage
                          name="acceptTerms"
                          component="div"
                          className="text-red-600 dark:text-red-400 text-sm mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Field
                        name="acceptPrivacy"
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                          I consent to receive communications about job opportunities and platform updates
                          <span className="text-red-500">*</span>
                        </label>
                        <ErrorMessage
                          name="acceptPrivacy"
                          component="div"
                          className="text-red-600 dark:text-red-400 text-sm mt-1"
                        />
                      </div>
                    </div>
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
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="w-4 h-4" />
                        <span>Create Company Account</span>
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
                Already have an account? Sign in here
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

export default CompanyRegister;
