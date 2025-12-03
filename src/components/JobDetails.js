// Helper to format salary for all types and pay period
function formatSalary(salary) {
  if (!salary || typeof salary !== "object") return null;
  const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
  };
  const payPeriodLabels = {
    year: "per year",
    month: "per month",
    day: "per day",
    hour: "per hour",
  };
  const symbol = currencySymbols[salary.currency] || salary.currency || "";
  const payPeriod = salary.payPeriod ? payPeriodLabels[salary.payPeriod] || salary.payPeriod : "";
  if (salary.type === "negotiable") {
    return `Negotiable${payPeriod ? ` (${payPeriod})` : ""}`;
  } else if (salary.type === "exact") {
    return `${symbol} ${salary.min || salary.amount || ''}${payPeriod ? ` / ${payPeriod}` : ""}`;
  } else if (salary.type === "range" && salary.min && salary.max) {
    if (salary.min === salary.max) {
      return `${symbol} ${salary.min}${payPeriod ? ` / ${payPeriod}` : ""}`;
    } else {
      return `${symbol} ${salary.min} - ${symbol} ${salary.max}${payPeriod ? ` / ${payPeriod}` : ""}`;
    }
  } else if (salary.min && salary.max) {
    if (salary.min === salary.max) {
      return `${symbol} ${salary.min}${payPeriod ? ` / ${payPeriod}` : ""}`;
    } else {
      return `${symbol} ${salary.min} - ${symbol} ${salary.max}${payPeriod ? ` / ${payPeriod}` : ""}`;
    }
  } else if (salary.min) {
    return `${symbol} ${salary.min}${payPeriod ? ` / ${payPeriod}` : ""}`;
  } else if (salary.max) {
    return `${symbol} ${salary.max}${payPeriod ? ` / ${payPeriod}` : ""}`;
  } else {
    return "Not specified";
  }
}
// src/components/JobDetails.js

// Utility to format date as DD/MM/YYYY
function formatDateDMY(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date)) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
// Use shared axios instance for authenticated API calls
import axiosInstance from "../axiosInstance";
// For any potential unauthenticated third-party calls we can still import axios if needed
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBriefcase,
  FaStar,
  FaMoneyBillWave,
  FaClock,
  FaGlobe,
  FaBuilding,
  FaBookmark,
  FaRegBookmark,
  FaPaperPlane,
  FaCheckCircle,
} from "react-icons/fa";
import Header from "../components/Header";
import { startConversation } from "../api/chatApi";
import { useNavigate } from "react-router-dom";
import ApplyModal from "../components/ApplyModal";
import { useAuth } from "../context/AuthContext";

/**
 * Skeleton loader with dark mode support
 */
const SkeletonLoader = () => (
  <div className="animate-pulse space-y-6 p-6">
    {/* Header Section */}
    <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
        <div className="space-y-2">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64" />
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-48" />
        </div>
      </div>
      <div className="flex space-x-3">
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-20" />
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>

    {/* Basic Info Section */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
    </div>

    {/* Detailed Sections */}
    <div className="space-y-4">
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
    <div className="space-y-4">
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>

    {/* Contact Email */}
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
  </div>
);

/**
 * timeAgo: Converts a date string into a human-readable relative time
 */
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
};

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTopBar, setShowTopBar] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [userApplication, setUserApplication] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);

  // Fetch industries from database
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await axiosInstance.get("/industries");

        if (response.data && response.data.success && response.data.data) {
          const fetchedIndustries = response.data.data.map(industry => ({
            id: industry._id,
            name: industry.name
          }));
          setIndustries(fetchedIndustries);
        } else {
          // Fallback to static industries if API fails
          const fallbackIndustries = [
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
          ];
          setIndustries(fallbackIndustries.map((name, index) => ({
            id: `fallback-${index}`,
            name
          })));
        }
      } catch (error) {
        console.error("Error fetching industries:", error);
        // Fallback to static industries
        const fallbackIndustries = [
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
        ];
        setIndustries(fallbackIndustries.map((name, index) => ({
          id: `fallback-${index}`,
          name
        })));
      } finally {
        setIndustriesLoading(false);
      }
    };

    fetchIndustries();
  }, []);

  // Get industry name by ID
  const getIndustryName = (industryId) => {
    if (!industryId) return "Not specified";

    // If industries are still loading or empty, return the ID as fallback
    if (industriesLoading || industries.length === 0) {
      console.log("Industries still loading or empty, showing industry ID:", industryId);
      return industryId; // This might be the ID, but at least it shows something
    }

    // Try to find the industry by ID
    const industry = industries.find(ind => ind.id === industryId);
    if (industry) {
      console.log("Found industry:", industry.name, "for ID:", industryId);
      return industry.name;
    }

    // If not found, check if industryId is already a name (string)
    if (typeof industryId === 'string' && industryId.length > 0) {
      console.log("Industry ID appears to be a name already:", industryId);
      return industryId; // It's already a name
    }

    console.log("Industry not found for ID:", industryId);
    return "Industry not found";
  };

  // Fetch job details
  const fetchJobDetails = () => {
    axiosInstance
      .get(`/jobs/${id}`)
      .then((response) => {
        setJob(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching job details:", error);
        setLoading(false);
      });
  };

  // Fetch all user applications once and derive this job's application.
  // Avoids noisy 404 for jobs not yet applied.
  const fetchUserApplication = () => {
    axiosInstance
      .get('/applications/my')
      .then((response) => {
        const apps = Array.isArray(response.data) ? response.data : [];
        const found = apps.find(app => {
          const jobId = app.jobId? app.jobId.toString() : '';
          return jobId === id;
        });
        setUserApplication(found || null);
      })
      .catch((error) => {
        // If unauthorized, keep null; otherwise log once
        if (error.response && error.response.status === 401) {
          setUserApplication(null);
        } else {
          console.error('Error fetching user applications list:', error);
        }
      });
  };

  // Fetch saved state for this job
  const fetchSavedState = () => {
    axiosInstance
      .get("/user/saved-jobs")
      .then((response) => {
        const saved = response.data.some((savedJob) => savedJob.job._id === id);
        setIsSaved(saved);
      })
      .catch((error) => console.error("Error fetching saved jobs:", error));
  };

  useEffect(() => {
    fetchJobDetails();
    fetchUserApplication();
    fetchSavedState();
  }, [id]);

  // Show sticky top bar when scrolled (if user has not applied)
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBar(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle saving the job
  const handleSaveJob = () => {
    axiosInstance
      .post(`/user/save-job/${id}`, {})
      .then(() => {
        setIsSaved(true);
      })
      .catch((error) => console.error("Error saving job:", error));
  };

  // Handle removing the saved job
  const handleRemoveSavedJob = () => {
    axiosInstance
      .delete(`/user/remove-job/${id}`)
      .then(() => {
        setIsSaved(false);
      })
      .catch((error) => console.error("Error removing job:", error));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-x-hidden">
        <Header />
        <div className="container mx-auto px-4 py-6 pt-24">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <SkeletonLoader />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-200 transition-colors overflow-x-hidden">
        <Header />
        <div className="container mx-auto px-4 py-6 pt-24">
          <p className="text-lg text-center mt-10">Job not found.</p>
        </div>
      </div>
    );
  }

  // Helpers for status & deadline
  const now = new Date();
  const isClosedStatus = job.status?.toLowerCase() === "closed";
  const isPastDeadline =
    job.applicationDeadline && new Date(job.applicationDeadline) < now;
  const isJobOpen = !isClosedStatus && !isPastDeadline;

  // Time since user applied
  const applicationTimeAgo = userApplication
    ? timeAgo(userApplication.createdAt)
    : "";

  // Render Save/Apply or disabled or “applied” badge
  const renderActionButtons = () => {
    if (userApplication) {
      return (
        <motion.div
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md font-semibold"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FaCheckCircle />
          <span>Application submitted {applicationTimeAgo}</span>
        </motion.div>
      );
    } else if (!isJobOpen) {
      return (
        <div className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-semibold">
          {isClosedStatus
            ? "This job is closed."
            : "Application deadline has ended."}
        </div>
      );
    } else {
      const isLoggedIn = userType === "user" && user;

      return (
        <>
          {isLoggedIn && (
            <button
              className="flex items-center space-x-1 px-4 py-2 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors font-semibold"
              onClick={isSaved ? handleRemoveSavedJob : handleSaveJob}
            >
              {isSaved ? <FaBookmark /> : <FaRegBookmark />}
              <span>{isSaved ? "Unsave" : "Save"}</span>
            </button>
          )}
          {isLoggedIn ? (
            <button
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-semibold"
              onClick={() => setShowApplyModal(true)}
            >
              <FaPaperPlane />
              <span>Apply</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-semibold"
            >
              <FaPaperPlane />
              <span>Login to Apply</span>
            </Link>
          )}
        </>
      );
    }
  };

  // Render the dots info in sticky bar
  const renderDottedInfo = () => (
    <div className="flex items-center flex-wrap space-x-2">
      <span className="font-semibold text-base text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
        {job.jobTitle}
      </span>
      <span className="text-gray-400 hidden sm:inline">•</span>
      <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
        {job.companyName}
      </span>
      <span className="text-gray-400 hidden sm:inline">•</span>
      <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
        {job.location}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-x-hidden">
      <Header />
      <motion.div
        className="container mx-auto max-w-screen-xl px-4 py-6 pt-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back link */}
        <Link
          to="/jobs"
          className="inline-flex items-center mb-6 text-blue-600 dark:text-blue-400 hover:underline transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Back to Job Listings
        </Link>

        {/* Sticky Top Bar */}
        <AnimatePresence>
          {!userApplication && showTopBar && (
            <motion.div
              className="fixed top-[60px] left-0 w-full bg-white dark:bg-gray-800 shadow-md py-2 px-4 z-50 flex items-center justify-between"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderDottedInfo()}
              <div className="flex space-x-2">{renderActionButtons()}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Job Details Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          {/* Title / Logo */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt="Company Logo"
                  className="w-16 h-16 object-contain rounded-full border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white break-words">
                  {job.jobTitle}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 break-words">
                  {job.companyName}
                </p>
              </div>
            </div>
            {/* Save / Apply / Disabled / Applied */}
            <div className="flex space-x-3">
              {renderActionButtons()}
              {job?.companyId && userType === "user" && user && (
                <button
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-semibold"
                  onClick={async () => {
                    try {
                      await startConversation("user", { companyId: job.companyId });
                      navigate("/chat");
                    } catch (e) {
                      console.error("Error starting conversation:", e);
                    }
                  }}
                >
                  <FaPaperPlane />
                  <span>Start Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg">
            {job.location && (
              <div className="flex items-center space-x-2 break-words">
                <FaMapMarkerAlt className="text-blue-500" />
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Location:</strong> {job.location}
                </p>
              </div>
            )}
            {job.createdAt && (
              <div className="flex items-center space-x-2 break-words">
                <FaCalendarAlt className="text-blue-500" />
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Posted on:</strong>{" "}
                  {formatDateDMY(job.createdAt)}{' '}
                  <span className="italic text-sm">
                    ({timeAgo(job.createdAt)})
                  </span>
                </p>
              </div>
            )}
            {job.jobType && (
              <div className="flex items-center space-x-2 break-words">
                <FaBriefcase className="text-blue-500" />
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Job Type:</strong> {job.jobType}
                </p>
              </div>
            )}
            {job.experienceLevel && (
              <div className="flex items-center space-x-2 break-words">
                <FaStar className="text-blue-500" />
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Experience:</strong> {job.experienceLevel}
                </p>
              </div>
            )}
                    {job.salary && (
                      <div className="flex items-center space-x-2 break-words">
                        <FaMoneyBillWave className="text-blue-500" />
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Salary:</strong> {formatSalary(job.salary)}
                        </p>
                      </div>
                    )}
            {job.applicationDeadline && (
              <div className="flex items-center space-x-2 break-words">
                <FaClock className="text-blue-500" />
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Deadline:</strong>{" "}
                  {formatDateDMY(job.applicationDeadline)}
                </p>
              </div>
            )}
            {typeof job.remoteOption !== "undefined" && (
              <div className="flex items-center space-x-2 break-words">
                <FaGlobe className="text-blue-500" />
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Remote:</strong> {job.remoteOption ? "Yes" : "No"}
                </p>
              </div>
            )}
            {job.industry && (
              <div className="flex items-center space-x-2 break-words">
                <FaBuilding className="text-blue-500" />
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Industry:</strong>{" "}
                  {industriesLoading ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    getIndustryName(job.industry)
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Detailed Sections */}
          <div className="mt-8 space-y-6">
            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700 break-words">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Required Skills
                </h2>
                <ul className="list-disc pl-6 text-gray-800 dark:text-gray-200 space-y-1">
                  {job.skills.map((skill, index) => (
                    <li key={index} className="break-words">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700 break-words">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Benefits
                </h2>
                <ul className="list-disc pl-6 text-gray-800 dark:text-gray-200 space-y-1">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="break-words">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700 break-words">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Responsibilities
                </h2>
                <ul className="list-disc pl-6 text-gray-800 dark:text-gray-200 space-y-1">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="break-words">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qualifications */}
            {job.qualifications && job.qualifications.length > 0 && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700 break-words">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Qualifications
                </h2>
                <ul className="list-disc pl-6 text-gray-800 dark:text-gray-200 space-y-1">
                  {job.qualifications.map((qual, index) => (
                    <li key={index} className="break-words">
                      {qual}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            {job.description && (
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700 break-words">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Job Description
                </h2>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed break-words whitespace-normal">
                  {job.description}
                </p>
              </div>
            )}

            {/* Contact Email */}
            {job.contactEmail && (
              <div className="break-words">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Contact Email:</strong>{" "}
                  <a
                    href={`mailto:${job.contactEmail}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline break-words"
                  >
                    {job.contactEmail}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Apply Modal */}
      <AnimatePresence>
        {!userApplication && showApplyModal && (
          <ApplyModal
            job={job}
            onClose={() => {
              setShowApplyModal(false);
              fetchUserApplication();
            }}
            onSuccess={fetchUserApplication}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobDetails;
