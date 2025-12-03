import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { FaSpinner, FaTimes, FaSort, FaSortUp, FaSortDown, FaClock, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";

const MyJobsPage = () => {
  const [filter, setFilter] = useState("applied");
  const [sortBy, setSortBy] = useState("recent");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch jobs based on filter
  useEffect(() => {
    // Clear jobs immediately when filter changes to avoid mix-ups
    setJobs([]);
    setLoading(true);
    const endpoint =
      filter === "applied" ? "/applications/applied" : "/user/saved-jobs";

    axiosInstance
      .get(endpoint)
      .then((response) => {
        if (filter === "applied") {
          setJobs(response.data.jobs || []);
        } else {
          // For saved jobs, extract job from each saved record and filter out nulls
          const extracted = response.data
            .map((saved) => saved.job)
            .filter((job) => job !== null);
          setJobs(extracted);
        }
      })
      .catch((error) => {
        console.error("Error fetching jobs:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filter]);

  const handleUnsaveJob = (jobId) => {
    axiosInstance
      .delete(`/user/remove-job/${jobId}`)
      .then(() => {
        setJobs((prev) => prev.filter((job) => job._id !== jobId));
      })
      .catch((error) => {
        console.error("Error unsaving job:", error);
      });
  };

  // Helper function to format salary object into a string (range, exact, negotiable)
  const formatSalary = (salary) => {
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
  };

  // Helper function to format date as DD/MM/YYYY
  const formatDateDMY = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Sort jobs based on selected criteria
  const sortJobs = (jobsToSort) => {
    if (!jobsToSort || jobsToSort.length === 0) return [];

    const sorted = [...jobsToSort];

    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = filter === "applied"
            ? (a.appliedAt || a.createdAt || a.updatedAt)
            : (a.savedAt || a.createdAt || a.updatedAt);
          const dateB = filter === "applied"
            ? (b.appliedAt || b.createdAt || b.updatedAt)
            : (b.savedAt || b.createdAt || b.updatedAt);
          return new Date(dateB) - new Date(dateA);
        });

      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = filter === "applied"
            ? (a.appliedAt || a.createdAt || a.updatedAt)
            : (a.savedAt || a.createdAt || a.updatedAt);
          const dateB = filter === "applied"
            ? (b.appliedAt || b.createdAt || b.updatedAt)
            : (b.savedAt || b.createdAt || b.updatedAt);
          return new Date(dateA) - new Date(dateB);
        });

      case "company":
        return sorted.sort((a, b) => {
          const companyA = (a.companyName || "").toLowerCase();
          const companyB = (b.companyName || "").toLowerCase();
          return companyA.localeCompare(companyB);
        });

      case "salary-high":
        return sorted.sort((a, b) => {
          const salaryA = a.salary ? (a.salary.max || a.salary.min || 0) : 0;
          const salaryB = b.salary ? (b.salary.max || b.salary.min || 0) : 0;
          return salaryB - salaryA;
        });

      case "salary-low":
        return sorted.sort((a, b) => {
          const salaryA = a.salary ? (a.salary.max || a.salary.min || 0) : 0;
          const salaryB = b.salary ? (b.salary.max || b.salary.min || 0) : 0;
          return salaryA - salaryB;
        });

      case "title":
        return sorted.sort((a, b) => {
          const titleA = (a.jobTitle || "").toLowerCase();
          const titleB = (b.jobTitle || "").toLowerCase();
          return titleA.localeCompare(titleB);
        });

      default:
        return sorted;
    }
  };

  // Get sorted jobs
  const sortedJobs = sortJobs(jobs);

  // Animation variants for job cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } },
  };

  // Sort options
  const sortOptions = [
    { value: "recent", label: "Recently Applied/Saved", icon: <FaClock className="w-4 h-4" /> },
    { value: "oldest", label: "Oldest First", icon: <FaSortUp className="w-4 h-4" /> },
    { value: "company", label: "Company Name", icon: <FaStar className="w-4 h-4" /> },
    { value: "title", label: "Job Title", icon: <FaSort className="w-4 h-4" /> },
    { value: "salary-high", label: "Highest Salary", icon: <FaSortDown className="w-4 h-4" /> },
    { value: "salary-low", label: "Lowest Salary", icon: <FaSortUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 overflow-x-hidden">
      <Header />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              My Jobs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your {filter === "applied" ? "applied" : "saved"} job applications
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {sortedJobs.length} {filter === "applied" ? "Applied" : "Saved"} Jobs
            </span>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <FaSort className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Filter Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setFilter("applied")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm flex items-center space-x-2 ${
                filter === "applied"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <span>Applied Jobs</span>
              {filter === "applied" && <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {sortedJobs.length}
              </span>}
            </button>
            <button
              onClick={() => setFilter("saved")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm flex items-center space-x-2 ${
                filter === "saved"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <span>Saved Jobs</span>
              {filter === "saved" && <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {sortedJobs.length}
              </span>}
            </button>
          </div>

          {/* Sort Info */}
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
            <FaSort className="w-4 h-4" />
            <span>Sorted by: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <FaSpinner className="animate-spin text-4xl text-blue-600 dark:text-blue-400" />
              <p className="text-gray-600 dark:text-gray-400">Loading your jobs...</p>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {!loading && sortedJobs.length > 0 ? (
          <AnimatePresence>
            <div className="space-y-4">
              {sortedJobs.map((job, index) => {
                const isClosed =
                  job.status && job.status.toLowerCase() === "closed";
                const isRecentlyApplied = filter === "applied" &&
                  job.appliedAt &&
                  (new Date() - new Date(job.appliedAt)) < (7 * 24 * 60 * 60 * 1000); // 7 days
                const isRecentlySaved = filter === "saved" &&
                  job.savedAt &&
                  (new Date() - new Date(job.savedAt)) < (7 * 24 * 60 * 60 * 1000); // 7 days

                return (
                  <motion.div
                    key={job._id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`relative flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border ${
                      isRecentlyApplied || isRecentlySaved
                        ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Recently Applied/Saved Badge */}
                    {(isRecentlyApplied || isRecentlySaved) && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        {isRecentlyApplied ? 'Recently Applied' : 'Recently Saved'}
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.companyName || "Company Logo"}
                          className="w-12 h-12 object-cover rounded-full border border-gray-200 dark:border-gray-600 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold text-sm">
                          {job.companyName?.charAt(0) || "C"}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {filter === "saved" && isClosed ? (
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {job.jobTitle}
                            </span>
                          ) : (
                            <Link
                              to={`/job/${job._id}`}
                              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {job.jobTitle}
                            </Link>
                          )}

                          {/* Status Badge */}
                          {isClosed && (
                            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full font-medium">
                              Closed
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {job.companyName}
                          {job.location && (
                            <span className="text-gray-500 dark:text-gray-500">
                              {" • "}
                              {job.location}
                            </span>
                          )}
                        </p>

                        <div className="flex items-center space-x-2 mt-2">
                          {job.salary && formatSalary(job.salary) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {formatSalary(job.salary)}
                            </span>
                          )}
                          {job.jobType && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {job.jobType}
                            </span>
                          )}
                          {filter === "applied" && job.appliedAt && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                              Applied {formatDateDMY(job.appliedAt)}
                            </span>
                          )}
                          {filter === "saved" && job.savedAt && (
                            <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                              Saved {formatDateDMY(job.savedAt)}
                            </span>
                          )}
                        </div>

                        {filter === "saved" && isClosed && (
                          <p className="mt-2 text-xs text-red-500">
                            This job is no longer active.
                          </p>
                        )}
                      </div>
                    </div>

                    {filter === "saved" && (
                      <button
                        onClick={() => handleUnsaveJob(job._id)}
                        className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Unsave job"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSort className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
                  No {filter === "applied" ? "applied" : "saved"} jobs found.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                  {filter === "applied"
                    ? "Start applying to jobs to see them here."
                    : "Save jobs you're interested in to keep track of them."
                  }
                </p>
                <Link
                  to="/jobs"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  Explore Jobs
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MyJobsPage;
