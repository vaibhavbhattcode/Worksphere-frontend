// src/components/JobList.js

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
// Use shared axios instance for API calls so Authorization header is attached
import axiosInstance from "../axiosInstance";
// Keep base axios for third‑party public APIs (e.g. location autocomplete)
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaBriefcase,
  FaClock,
  FaCheckCircle,
  FaFilter,
  FaBuilding,
  FaStar, // for the “Recommended” badge
} from "react-icons/fa";
import Select from "react-select";
import { createPortal } from 'react-dom';
import Header from "./Header";
import LocationInput from "./LocationInput";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";

const BASE_JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
];

const BASE_EXPERIENCE_LEVELS = [
  "Entry-level",
  "Mid-level",
  "Senior",
  "Executive",
];

const normalizeString = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeExperienceLevel = (value) => {
  const normalized = normalizeString(value).replace(/[_\s]+/g, "-");
  if (!normalized) return "";

  // Map common synonyms to schema values
  if (["entry-level", "entrylevel", "entry"].includes(normalized)) {
    return "entry-level";
  }
  if (["mid-level", "midlevel", "mid"].includes(normalized)) {
    return "mid-level";
  }
  if (["senior", "sr"].includes(normalized)) {
    return "senior";
  }
  if (["executive", "exec"].includes(normalized)) {
    return "executive";
  }

  return normalized;
};

const normalizeRemoteOption = (value) => {
  if (typeof value === "boolean") {
    return value ? "remote" : "on-site";
  }

  const normalized = normalizeString(value);

  if (!normalized) return "";

  if (["remote", "true", "yes", "fully remote", "work from home", "1"].includes(normalized)) {
    return "remote";
  }

  if (["hybrid", "flexible", "partial remote"].includes(normalized)) {
    return "hybrid";
  }

  if (["on-site", "onsite", "false", "no", "office", "0"].includes(normalized)) {
    return "on-site";
  }

  return normalized;
};

// LocationInput moved to reusable component ./LocationInput

////////////////////////////////////////////////////////////////////////////////
// timeAgo utility: “Just now,” “5 mins ago,” etc.
////////////////////////////////////////////////////////////////////////////////
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
};

////////////////////////////////////////////////////////////////////////////////
// Debounce hook (waits “delay” ms after the user stops typing)
////////////////////////////////////////////////////////////////////////////////
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

////////////////////////////////////////////////////////////////////////////////
// Framer Motion variants (stagger & card animations)
////////////////////////////////////////////////////////////////////////////////
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 20 },
  },
  hover: {
    y: -10,
    scale: 1.03,
    boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
    transition: { duration: 0.3 },
  },
};

////////////////////////////////////////////////////////////////////////////////
// Professional SkeletonCard with Enhanced Theme Support
const SkeletonCard = () => {
  const { darkMode } = useDarkMode();

  return (
    <div className={`rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl ${
      darkMode
        ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50'
        : 'bg-white/80 border-gray-200/50 hover:border-gray-300/50'
    } backdrop-blur-sm`}>
      <div className="p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            {/* Company Logo Skeleton */}
            <div className="relative">
              <div className={`w-16 h-16 rounded-xl overflow-hidden ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div className={`w-full h-full animate-pulse ${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-600 to-gray-700'
                    : 'bg-gradient-to-br from-gray-300 to-gray-400'
                }`}></div>
              </div>
              {/* Premium Badge */}
              <div className="absolute -top-1 -right-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    darkMode ? 'bg-yellow-400' : 'bg-yellow-500'
                  } animate-pulse`}></div>
                </div>
              </div>
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="space-y-2 mb-3">
                <div className={`h-6 rounded-lg animate-pulse ${
                  darkMode
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                    : 'bg-gradient-to-r from-gray-300 to-gray-400'
                }`} style={{width: '85%'}}></div>
                <div className={`h-4 rounded animate-pulse ${
                  darkMode
                    ? 'bg-gradient-to-r from-gray-700 to-gray-600'
                    : 'bg-gradient-to-r from-gray-400 to-gray-300'
                }`} style={{width: '60%'}}></div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`h-6 rounded-full animate-pulse ${
                    darkMode
                      ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50'
                      : 'bg-gradient-to-r from-blue-100 to-purple-100'
                  }`} style={{width: `${60 + Math.random() * 40}px`}}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button Skeleton */}
          <div className={`w-10 h-10 rounded-lg animate-pulse ${
            darkMode
              ? 'bg-gradient-to-br from-gray-600 to-gray-700'
              : 'bg-gradient-to-br from-gray-300 to-gray-400'
          }`}></div>
        </div>

        {/* Job Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-6 text-sm">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded animate-pulse ${
                  darkMode
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                    : 'bg-gradient-to-r from-gray-300 to-gray-400'
                }`}></div>
                <div className={`h-4 rounded animate-pulse ${
                  darkMode
                    ? 'bg-gradient-to-r from-gray-700 to-gray-600'
                    : 'bg-gradient-to-r from-gray-400 to-gray-300'
                }`} style={{width: `${50 + Math.random() * 30}px`}}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 mb-6">
          <div className={`h-4 rounded animate-pulse ${
            darkMode
              ? 'bg-gradient-to-r from-gray-700 to-gray-600'
              : 'bg-gradient-to-r from-gray-400 to-gray-300'
          }`} style={{width: '95%'}}></div>
          <div className={`h-4 rounded animate-pulse ${
            darkMode
              ? 'bg-gradient-to-r from-gray-700 to-gray-600'
              : 'bg-gradient-to-r from-gray-400 to-gray-300'
          }`} style={{width: '85%'}}></div>
          <div className={`h-4 rounded animate-pulse ${
            darkMode
              ? 'bg-gradient-to-r from-gray-700 to-gray-600'
              : 'bg-gradient-to-r from-gray-400 to-gray-300'
          }`} style={{width: '75%'}}></div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <div className={`flex-1 h-12 rounded-xl animate-pulse ${
            darkMode
              ? 'bg-gradient-to-r from-blue-900 to-purple-900'
              : 'bg-gradient-to-r from-blue-600 to-purple-600'
          }`}></div>
          <div className={`w-12 h-12 rounded-xl animate-pulse ${
            darkMode
              ? 'bg-gradient-to-br from-gray-600 to-gray-700'
              : 'bg-gradient-to-br from-gray-300 to-gray-400'
          }`}></div>
        </div>
      </div>
    </div>
  );
};

////////////////////////////////////////////////////////////////////////////////
// Memoized JobCard Component for Performance
////////////////////////////////////////////////////////////////////////////////
const JobCard = React.memo(({ job, index, appliedJobIds, committedSearchTerm, timeAgo }) => {
  return (
    <motion.div
      key={job._id}
      layout
      variants={cardVariants}
      whileHover="hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-600/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-blue-200 dark:hover:border-blue-600 flex flex-col h-full"
    >
      {/* Card Content - Flex grow to fill space */}
      <div className="p-6 lg:p-8 flex flex-col flex-grow">
        {/* Company Header Section - Fixed Height */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={job.companyLogo || "/default-logo.png"}
                alt={job.companyName}
                className="w-14 h-14 lg:w-16 lg:h-16 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                loading="lazy"
                decoding="async"
              />
              {job.isRecommended && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 p-1.5 rounded-full shadow-xl animate-bounce z-10 border-2 border-yellow-600">
                  <FaStar className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 truncate">
                {job.companyName}
              </h3>
              <div className="flex items-center space-x-2 flex-wrap">
                {appliedJobIds.has(job._id.toString()) && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-600">
                    <FaCheckCircle className="mr-1 w-3 h-3" />
                    Applied
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job Title Section - Fixed Height */}
        <div className="mb-5">
          <Link to={`/job/${job._id}`} className="block group/link">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors duration-300 leading-tight line-clamp-2 mb-2">
              {job.jobTitle}
              {committedSearchTerm.trim() !== "" && job.jobTitle.toLowerCase().includes(committedSearchTerm.trim().toLowerCase()) && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-600">
                  Match
                </span>
              )}
            </h2>
          </Link>
        </div>

        {/* Job Details Section - Fixed Height with Truncation */}
        <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400 mb-6 flex-grow">
          <div className="flex items-start group/item">
            <FaMapMarkerAlt className="mr-3 text-blue-500 w-4 h-4 flex-shrink-0 mt-0.5 group-hover/item:text-blue-600 transition-colors duration-200" />
            <span 
              className="font-medium group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors duration-200 line-clamp-2"
              title={job.location}
            >
              {job.location}
            </span>
          </div>
          <div className="flex items-center group/item">
            <FaBriefcase className="mr-3 text-green-500 w-4 h-4 flex-shrink-0 group-hover/item:text-green-600 transition-colors duration-200" />
            <span className="font-medium group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors duration-200">{job.jobType}</span>
          </div>
          <div className="flex items-center group/item">
            <FaClock className="mr-3 text-purple-500 w-4 h-4 flex-shrink-0 group-hover/item:text-purple-600 transition-colors duration-200" />
            <span className="font-medium group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors duration-200">{timeAgo(job.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Action Button Section - Fixed at Bottom */}
      <div className="px-6 lg:px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-t border-gray-200 dark:border-gray-600 group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-900/20 dark:group-hover:to-blue-800/20 transition-all duration-300">
        <Link
          to={`/job/${job._id}`}
          className="block w-full text-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.job._id === nextProps.job._id &&
    prevProps.appliedJobIds.has(prevProps.job._id.toString()) === nextProps.appliedJobIds.has(nextProps.job._id.toString()) &&
    prevProps.committedSearchTerm === nextProps.committedSearchTerm
  );
});

JobCard.displayName = 'JobCard';

////////////////////////////////////////////////////////////////////////////////
// MAIN COMPONENT
////////////////////////////////////////////////////////////////////////////////
const JobList = () => {
  const { user } = useAuth();
  const locationObj = useLocation();
  const params = new URLSearchParams(locationObj.search);

  const initialSearch = params.get("search") || "";
  const initialLocation = params.get("location") || "";
  const initialJobType = params.get("jobType") || "";
  const initialIndustry = params.get("industry") || "";

  // ─── State: Paginated jobs with infinite scroll ───
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [industriesError, setIndustriesError] = useState(null);

  // Filter/Search state
  const [searchTerm, setSearchTerm] = useState(initialSearch); // UI typing only
  const [committedSearchTerm, setCommittedSearchTerm] = useState(initialSearch); // used for filtering
  // Use a ref to store the previous search term to prevent unnecessary re-renders
  const prevSearchTermRef = React.useRef(initialSearch);
  
  // Custom hook to handle search term updates efficiently
  const handleSearchTermChange = React.useCallback((newTerm) => {
    // Only update if the term has changed significantly
    if (newTerm !== prevSearchTermRef.current) {
      prevSearchTermRef.current = newTerm;
      setSearchTerm(newTerm);
    }
  }, []);
  const [filters, setFilters] = useState({
    jobType: initialJobType || "",
    remote: "",
    experience: "",
    industry: initialIndustry ? [initialIndustry] : [],
    datePosted: "",
    location: initialLocation,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [locationValid, setLocationValid] = useState(true); // enforce suggestion selection
  const [locationInputKey, setLocationInputKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );

  // Debounce the searchTerm so that we only process filtering once the user pauses typing
  // Using a 500ms delay to balance responsiveness with network/load optimizations
  const debouncedQuery = useDebounce(searchTerm, 500);

  // Watch for theme changes to update Industry Select component
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const trimmed = (debouncedQuery || "").trim();
    if (trimmed !== committedSearchTerm) {
      setCommittedSearchTerm(trimmed);
    }
  }, [debouncedQuery, committedSearchTerm]);
  // Build query params for paginated API
  const buildQueryParams = React.useCallback((page = 1, filtersObj = filters, search = committedSearchTerm) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '20'); // Load 20 jobs per page
    
    // Include userId for recommendation badge
    if (user && user._id) {
      params.append('userId', user._id);
    }
    
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (filtersObj.location && filtersObj.location.trim()) {
      params.append('location', filtersObj.location.trim());
    }
    if (filtersObj.jobType) {
      params.append('jobType', filtersObj.jobType);
    }
    if (filtersObj.remote) {
      params.append('remote', filtersObj.remote);
    }
    if (filtersObj.experience) {
      params.append('experience', filtersObj.experience);
    }
    if (filtersObj.datePosted) {
      params.append('datePosted', filtersObj.datePosted);
    }
    if (filtersObj.industry && filtersObj.industry.length > 0) {
      // Send each selected industry as a repeated query param instead of a CSV
      // e.g. ?industry=Finance&industry=Technology
      filtersObj.industry.forEach((ind) => {
        if (ind != null && String(ind).trim() !== '') params.append('industry', String(ind).trim());
      });
    }
    
    return params.toString();
  }, [filters, committedSearchTerm, user]);

  // 1) Fetch jobs with pagination (initial load and filter changes)
  // ───────────────────────────────────────────────────────────────────────────
  const fetchJobs = React.useCallback(async (page = 1, reset = true) => {
    if (reset) {
      setLoading(true);
      setJobs([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const queryString = buildQueryParams(page, filters, committedSearchTerm);
      const response = await axiosInstance.get(`/jobs/paginated?${queryString}`);
      
      const { jobs: fetchedJobs, pagination } = response.data || {};
      
      // Debug: Check for recommended jobs
      if (fetchedJobs && fetchedJobs.length > 0) {
        const recommendedCount = fetchedJobs.filter(job => job.isRecommended).length;
        const recommendedJobs = fetchedJobs.filter(job => job.isRecommended);
        
        if (recommendedCount > 0) {
          console.log(`⭐ Found ${recommendedCount} recommended jobs out of ${fetchedJobs.length} total`);
          console.log(`📋 Recommended jobs:`, recommendedJobs.map(j => ({
            title: j.jobTitle,
            score: j.recommendationScore,
            company: j.companyName
          })));
          
          // Log success - no popup to avoid interrupting user
        } else {
          console.log(`ℹ️ No recommended jobs found. User ID: ${user?._id || 'not logged in'}`);
          console.log(`💡 To see recommendations:`);
          console.log(`   1. Search for jobs (creates search history)`);
          console.log(`   2. Add skills to your profile`);
          console.log(`   3. Set industry/experience/location preferences in profile`);
        }
      }
      
      if (reset) {
        setJobs(fetchedJobs || []);
      } else {
        setJobs(prev => [...prev, ...(fetchedJobs || [])]);
      }
      
      setCurrentPage(page);
      setTotalJobs(pagination?.totalJobs || 0);
      setHasMore(pagination?.hasNextPage || false);
    } catch (error) {
      console.error("❌ Error fetching jobs:", error);
      if (reset) {
        setJobs([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQueryParams, filters, committedSearchTerm]);

  // Track previous filters/search to detect changes
  const prevFiltersRef = React.useRef(null);
  const prevSearchRef = React.useRef(null);
  const isInitialMount = React.useRef(true);

  // Initial load and when filters/search change
  useEffect(() => {
    // Always fetch on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchJobs(1, true);
      return;
    }

    // For subsequent updates, check if filters/search actually changed
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    const searchChanged = prevSearchRef.current !== committedSearchTerm;
    
    if (filtersChanged || searchChanged) {
      prevFiltersRef.current = filters;
      prevSearchRef.current = committedSearchTerm;
      fetchJobs(1, true);
    }
  }, [filters, committedSearchTerm, fetchJobs]);

  // Infinite scroll: Load more jobs when scrolling near bottom
  const loadMoreRef = React.useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchJobs(currentPage + 1, false);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, loading, currentPage, fetchJobs]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2) Fetch “My Applications” so we can mark “Applied” jobs
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        const resp = await axiosInstance.get("/applications/my");
        const appliedIds = new Set(
          resp.data.map((app) => app.jobId.toString())
        );
        setAppliedJobIds(appliedIds);
      } catch (err) {
        console.error("Error fetching applied jobs:", err);
      }
    };
    fetchAppliedJobs();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // 3) Whenever `debouncedSearchTerm` updates, store that query in /api/searches
  // so the backend can incorporate it into recommendations
  // ───────────────────────────────────────────────────────────────────────────
  // When a search is committed (button/enter/suggestion), store query once
  useEffect(() => {
    const q = (committedSearchTerm || "").trim();
    if (q.length >= 2) {
      axiosInstance.post("/searches", { query: q }).catch(() => {});
    }
  }, [committedSearchTerm]);

  // ───────────────────────────────────────────────────────────────────────────
  // 4) Fetch industries from API
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchIndustries = async () => {
      setIndustriesLoading(true);
      setIndustriesError(null);

      try {
        const response = await axiosInstance.get("/industries");
        const industriesData = response?.data?.data;
        if (Array.isArray(industriesData)) {
          setIndustries(industriesData);
        } else {
          throw new Error("Invalid industries payload");
        }
      } catch (error) {
        console.error("❌ Error fetching industries from API:", error);
        setIndustriesError("Failed to load industries");
        setIndustries([]);
      } finally {
        setIndustriesLoading(false);
      }
    };
    fetchIndustries();
  }, []);
  // ───────────────────────────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setFilters({
      jobType: "",
      remote: "",
      experience: "",
      industry: [],
      datePosted: "",
      location: "",
    });
    setSearchTerm("");
    setCommittedSearchTerm("");
    setLocationValid(true);
    setLocationInputKey((prev) => prev + 1);
    // Clear location input and suggestions - these are handled by the LocationInput component
    // setSelectedLocation("");
    // setSuggestions([]);
  };

  // Update filters only when location is selected (not during typing)
  const handleLocationSelect = (location) => {
    setFilters((prev) => ({ ...prev, location }));
  };

  // Create a search index for better performance
  const searchIndex = React.useMemo(() => {
    if (!jobs || jobs.length === 0) return null;
    
    // Create an index of searchable terms for each job
    const index = new Map();
    jobs.forEach(job => {
      const terms = new Set([
        job.jobTitle.toLowerCase(),
        job.companyName.toLowerCase(),
        job.location.toLowerCase(),
        ...(Array.isArray(job.skills) ? job.skills.map(skill => skill.toLowerCase()) : [])
      ]);
      index.set(job._id, terms);
    });
    
    return index;
  }, [jobs]);

  // Build job title suggestions from jobs + fallback list
  const titleSet = React.useMemo(() => {
    const set = new Set();
    jobs.forEach(j => { if (j?.jobTitle) set.add(j.jobTitle.trim()); });
    return Array.from(set);
  }, [jobs]);

  const jobTypeOptions = React.useMemo(() => {
    const dynamicTypes = new Set(BASE_JOB_TYPES);
    jobs.forEach((job) => {
      if (job?.jobType) {
        dynamicTypes.add(job.jobType);
      }
    });
    return Array.from(dynamicTypes);
  }, [jobs]);

  const experienceOptions = React.useMemo(() => {
    const dynamicLevels = new Set(BASE_EXPERIENCE_LEVELS.map(normalizeExperienceLevel));
    jobs.forEach((job) => {
      if (job?.experienceLevel) {
        dynamicLevels.add(normalizeExperienceLevel(job.experienceLevel));
      }
    });

    const denormalizedMap = {
      "entry-level": "Entry-level",
      "mid-level": "Mid-level",
      senior: "Senior",
      executive: "Executive",
    };

    return Array.from(dynamicLevels)
      .filter(Boolean)
      .map((level) => denormalizedMap[level] || level)
      .filter(Boolean);
  }, [jobs]);

  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [activeTitleIndex, setActiveTitleIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const [suggestionPos, setSuggestionPos] = useState(null);

  useEffect(() => {
    const q = (debouncedQuery || "").trim().toLowerCase();
    if (q.length < 2) {
      setTitleSuggestions([]);
      setActiveTitleIndex(-1);
      return;
    }
    const suggestions = titleSet
      .filter(t => t.toLowerCase().includes(q))
      .slice(0, 10);
    setTitleSuggestions(suggestions);
    setActiveTitleIndex(suggestions.length ? 0 : -1);
  }, [debouncedQuery, titleSet]);

  const commitSearch = (term) => {
    const t = (term ?? searchTerm).trim();
    setCommittedSearchTerm(t);
    setTitleSuggestions([]);
    setActiveTitleIndex(-1);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Since we're using server-side pagination with filtering, jobs are already filtered
  // No need for client-side filtering - just use jobs directly
  // ───────────────────────────────────────────────────────────────────────────
  const displayJobs = React.useMemo(() => {
    // If no industry filter selected, just return server results
    const selectedIndustries = Array.isArray(filters.industry) ? filters.industry.filter(Boolean) : [];
    if (!selectedIndustries || selectedIndustries.length === 0) return jobs || [];

    // Normalize selection to lowercase for comparisons
    const selectedLower = selectedIndustries.map((s) => String(s).toLowerCase().trim());

    const matchesIndustry = (job) => {
      if (!job) return false;
      const ind = job.industry;
      if (!ind) return false;

      // industry may be a populated object { _id, name, slug }, or a string id/name
      if (typeof ind === 'string') {
        return selectedLower.includes(ind.toLowerCase());
      }

      if (Array.isArray(ind)) {
        // unlikely, but handle array of industry refs/names
        return ind.some((it) => {
          if (!it) return false;
          if (typeof it === 'string') return selectedLower.includes(it.toLowerCase());
          if (typeof it === 'object') {
            const name = (it.name || '').toString().toLowerCase();
            const slug = (it.slug || '').toString().toLowerCase();
            const id = (it._id || '').toString().toLowerCase();
            return selectedLower.includes(name) || selectedLower.includes(slug) || (id && selectedLower.includes(id));
          }
          return false;
        });
      }

      if (typeof ind === 'object') {
        const name = (ind.name || '').toString().toLowerCase();
        const slug = (ind.slug || '').toString().toLowerCase();
        const id = (ind._id || ind.id || '').toString().toLowerCase();
        return selectedLower.includes(name) || selectedLower.includes(slug) || (id && selectedLower.includes(id));
      }

      return false;
    };

    return (jobs || []).filter((j) => matchesIndustry(j));
  }, [jobs, filters.industry]);

  // Legacy filteredJobs for backward compatibility (now just returns jobs)
  // Server-side filtering handles all filtering, so no client-side processing needed
  const filteredJobs = React.useMemo(() => {
    return jobs || [];
  }, [jobs]);

  // Debug: Log filtered results when filters change
  // Performance monitoring effect
  useEffect(() => {
    if (committedSearchTerm.trim() !== "" && filteredJobs.length > 0) {
      console.log(`🔍 Search results: ${filteredJobs.length} jobs found`);
    }
  }, [filteredJobs, committedSearchTerm]);
  
  // Memoize the job list to prevent unnecessary re-renders
  const memoizedJobList = React.useMemo(() => displayJobs, [displayJobs]);

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans pt-16">
        {/* ====================== SEARCH BAR ====================== */}
        <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-5xl mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8">
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Find Your Dream Job
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                  Discover opportunities that match your skills and ambitions
                </p>
              </div>
              <div className="relative max-w-2xl mx-auto">
                <FaSearch className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg sm:text-xl" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchTermChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveTitleIndex((i) => Math.min(i + 1, Math.max(titleSuggestions.length - 1, 0)));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveTitleIndex((i) => Math.max(i - 1, 0));
                    } else if (e.key === 'Enter') {
                      if (activeTitleIndex >= 0 && titleSuggestions[activeTitleIndex]) {
                        const t = titleSuggestions[activeTitleIndex];
                        setSearchTerm(t);
                        commitSearch(t);
                      } else {
                        commitSearch();
                      }
                    } else if (e.key === 'Escape') {
                      setTitleSuggestions([]);
                      setActiveTitleIndex(-1);
                    }
                  }}
                  placeholder="Search for jobs, companies, or skills..."
                  className="w-full pl-12 sm:pl-14 pr-16 sm:pr-20 py-3 sm:py-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-200 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg placeholder-gray-500"
                  aria-label="Search jobs"
                  autoComplete="off"
                />
                {/* Suggestions dropdown (portaled to body to avoid sidebar clipping) */}
                {titleSuggestions.length > 0 && searchInputRef.current && (() => {
                  // compute position
                  const rect = searchInputRef.current.getBoundingClientRect();
                  const top = rect.bottom + window.scrollY;
                  const left = rect.left + window.scrollX;
                  const width = rect.width;

                  const ul = (
                    <ul
                      style={{
                        position: 'absolute',
                        top: top + 'px',
                        left: left + 'px',
                        width: width + 'px',
                        zIndex: 99999,
                      }}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-auto"
                    >
                      {titleSuggestions.map((t, idx) => (
                        <li
                          key={`${t}-${idx}`}
                          className={`px-4 py-2 cursor-pointer text-gray-700 dark:text-gray-200 ${idx === activeTitleIndex ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'hover:bg-blue-50 dark:hover:bg-gray-700'}`}
                          onMouseDown={() => { setSearchTerm(t); commitSearch(t); }}
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  );

                  return createPortal(ul, document.body);
                })()}
                <button 
                  onClick={() => commitSearch()}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors duration-200 font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Search jobs"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 pb-16 flex flex-col lg:flex-row gap-8">
          {/* ====================== FILTERS SIDEBAR (desktop) ====================== */}
          <aside className="hidden lg:block lg:w-80 xl:w-96 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 sticky top-20 h-fit max-h-[calc(100vh-5rem)] overflow-y-auto backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Filters
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Refine your search
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors duration-200">
                <FaFilter className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
            </div>
            {/* Professional Filter Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column */}
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Job Type
                  </label>
                  <select
                    value={filters.jobType}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        jobType: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 group-hover:shadow-md"
                  >
                    <option value="">Any Type</option>
                    {jobTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Remote Option
                  </label>
                  <select
                    value={filters.remote}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        remote: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 group-hover:shadow-md"
                  >
                    <option value="">Any</option>
                    <option value="true">Remote</option>
                    <option value="false">On-site</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Experience Level
                  </label>
                  <select
                    value={filters.experience}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        experience: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 group-hover:shadow-md"
                  >
                    <option value="">Any Level</option>
                    {experienceOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Date Posted
                  </label>
                  <select
                    value={filters.datePosted}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        datePosted: e.target.value,
                      }))
                    }
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 group-hover:shadow-md"
                  >
                    <option value="">Any Time</option>
                    <option value="24h">Past 24h</option>
                    <option value="week">Past week</option>
                    <option value="month">Past month</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Filter - Full Width with enforced suggestion selection */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Location
              </label>
              <div className="relative group">
                <LocationInput
                  key={locationInputKey}
                  value={filters.location}
                  onChange={handleLocationSelect}
                  placeholder="Enter city (e.g., Surat)"
                  requireSelection
                  onValidityChange={(valid) => setLocationValid(valid)}
                  className="w-full text-base"
                />
              </div>
              {!locationValid && filters.location.trim() !== "" && (
                <p className="mt-2 text-xs text-red-600">Please select a city from suggestions.</p>
              )}
            </div>

            {/* Industry Filter - Full Width */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Industry
              </label>
              <Select
                key={`industry-select-${isDarkMode}`}
                isMulti
                value={filters.industry.map((i) => ({ label: i, value: i }))}
                onChange={(selectedOptions) =>
                  setFilters((prev) => ({
                    ...prev,
                    industry: (selectedOptions || []).map((opt) => opt.value),
                  }))
                }
                options={industries.map((i) => ({ label: i.name, value: i.name }))}
                isLoading={industriesLoading}
                isDisabled={industriesLoading}
                placeholder="Select industries"
                className="w-full"
                classNamePrefix="react-select"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={{
                  control: (provided, state) => {
                    return {
                      ...provided,
                      minHeight: '48px',
                      fontSize: '16px',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: state.isFocused 
                        ? '#3b82f6' 
                        : (isDarkMode ? '#4b5563' : '#e5e7eb'),
                      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      boxShadow: state.isFocused 
                        ? '0 0 0 3px rgba(59, 130, 246, 0.1)' 
                        : (isDarkMode ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'),
                      '&:hover': {
                        borderColor: '#3b82f6',
                      },
                    };
                  },
                  valueContainer: (provided) => ({
                    ...provided,
                    minHeight: '46px',
                    padding: '8px 16px',
                  }),
                  input: (provided) => {
                    return {
                      ...provided,
                      fontSize: '16px',
                      margin: '0',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    };
                  },
                  placeholder: (provided) => ({
                    ...provided,
                    fontSize: '16px',
                    color: '#9ca3af',
                  }),
                  menu: (provided) => {
                    return {
                      ...provided,
                      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      boxShadow: isDarkMode 
                        ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
                        : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      zIndex: 9999,
                    };
                  },
                  menuPortal: (provided) => ({
                    ...provided,
                    zIndex: 9999,
                  }),
                  option: (provided, state) => {
                    return {
                      ...provided,
                      backgroundColor: state.isSelected
                        ? '#3b82f6'
                        : state.isFocused
                        ? (isDarkMode ? '#4b5563' : '#f3f4f6')
                        : (isDarkMode ? '#374151' : '#ffffff'),
                      color: state.isSelected 
                        ? '#ffffff' 
                        : (isDarkMode ? '#f3f4f6' : '#1f2937'),
                      '&:hover': {
                        backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                      },
                    };
                  },
                  multiValue: (provided) => ({
                    ...provided,
                    backgroundColor: '#1e40af',
                    borderRadius: '8px',
                    padding: '4px 8px',
                  }),
                  multiValueLabel: (provided) => ({
                    ...provided,
                    color: '#ffffff',
                    fontSize: '14px',
                  }),
                  multiValueRemove: (provided) => ({
                    ...provided,
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#1e3a8a',
                      color: '#ffffff',
                    },
                  }),
                  singleValue: (provided) => {
                    return {
                      ...provided,
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                    };
                  },
                }}
              />
            </div>

            {/* Clear Filters Button */}
            <div className="mt-8">
              <button
                onClick={handleClearFilters}
                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          {/* ====================== FILTERS SIDEBAR (mobile) - HIDDEN ====================== */}
          {/* Mobile filters are now only available through the Advanced Filters overlay */}

          {/* ====================== FILTERS BUTTON (mobile) ====================== */}
          <div className="lg:hidden mb-8">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg w-full sm:w-auto"
            >
              <FaFilter className="mr-3 text-xl" />
              Advanced Filters
            </button>
          </div>

          {/* ====================== MAIN CONTENT: JOB LIST ====================== */}
          <main className="flex-1">
            {/* ─────────────────────────────────────────────────────────
                Show total count of all filtered jobs
            ───────────────────────────────────────────────────────── */}
            {!loading && (
              <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {totalJobs > 0 ? totalJobs : memoizedJobList.length} Job
                      {(totalJobs > 0 ? totalJobs : memoizedJobList.length) !== 1 ? "s" : ""} Found
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {memoizedJobList.length > 0 
                        ? `Showing ${memoizedJobList.length} of ${totalJobs || memoizedJobList.length} jobs` 
                        : "Try adjusting your filters"}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <FaBriefcase className="text-blue-600 dark:text-blue-400 text-2xl" />
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              // ─────────────────────────────────────────────────────
              // Premium skeleton cards while loading
              // ─────────────────────────────────────────────────────
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Array.from({ length: Math.min(memoizedJobList.length || 6, 6) }).map((_, idx) => (
                  <SkeletonCard key={idx} />
                ))}
              </div>
            ) : memoizedJobList.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-600/50 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaSearch className="text-blue-600 dark:text-blue-400 text-3xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    No Jobs Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 leading-relaxed">
                    {filters.location
                      ? `No jobs found in ${filters.location}. Try adjusting your search criteria or explore other locations.`
                      : "No jobs match your current filters. Try broadening your search or clearing some filters."
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleClearFilters}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={handleClearFilters}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                    >
                      Reset Search
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
                >
                  {memoizedJobList.map((job, index) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      index={index}
                      appliedJobIds={appliedJobIds}
                      committedSearchTerm={committedSearchTerm}
                      timeAgo={timeAgo}
                    />
                  ))}
                </motion.div>

                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div 
                    ref={loadMoreRef}
                    className="flex justify-center items-center py-8"
                  >
                    {loadingMore && (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                          Loading more jobs...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* End of Results Message */}
                {!hasMore && memoizedJobList.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                      You've reached the end of the results
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* ====================== MOBILE FILTERS OVERLAY ====================== */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 lg:hidden"
            >
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 w-full sm:w-96 max-h-[95vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto backdrop-blur-sm border-t border-gray-200 dark:border-gray-600"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        Filters
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Refine your search
                      </p>
                    </div>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Professional Filter Grid Layout for Mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Left Column */}
                      <div className="space-y-5">
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Job Type
                          </label>
                          <select
                            value={filters.jobType}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                jobType: e.target.value,
                              }))
                            }
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 group-hover:shadow-md"
                          >
                            <option value="">Any Type</option>
                            {jobTypeOptions.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Remote Option
                          </label>
                          <select
                            value={filters.remote}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                remote: e.target.value,
                              }))
                            }
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 group-hover:shadow-md"
                          >
                            <option value="">Any</option>
                            <option value="true">Remote</option>
                            <option value="false">On-site</option>
                          </select>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-5">
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Experience Level
                          </label>
                          <select
                            value={filters.experience}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                experience: e.target.value,
                              }))
                            }
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 group-hover:shadow-md"
                          >
                            <option value="">Any Level</option>
                            {experienceOptions.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Date Posted
                          </label>
                          <select
                            value={filters.datePosted}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                datePosted: e.target.value,
                              }))
                            }
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 group-hover:shadow-md"
                          >
                            <option value="">Any Time</option>
                            <option value="24h">Past 24h</option>
                            <option value="week">Past week</option>
                            <option value="month">Past month</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Location Filter - Full Width (mobile) with suggestion enforcement */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Location</label>
                      <LocationInput
                        key={`${locationInputKey}-overlay`}
                        value={filters.location}
                        onChange={(val) =>
                          setFilters((prev) => ({ ...prev, location: val }))
                        }
                        placeholder="Enter city (e.g., Surat)"
                        requireSelection
                        onValidityChange={(valid) => setLocationValid(valid)}
                        className="text-base"
                      />
                      {!locationValid && filters.location.trim() !== "" && (
                        <p className="mt-2 text-xs text-red-600">Please select a city from suggestions.</p>
                      )}
                    </div>

                    {/* Industry Filter - Full Width */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Industry
                      </label>
                      {industriesLoading ? (
                        <div className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 animate-pulse">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded mr-3"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                          </div>
                        </div>
                      ) : industriesError ? (
                        <div className="w-full p-4 border border-red-200 dark:border-red-600 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          <div className="flex items-center">
                            <FaFilter className="mr-3" />
                            {industriesError}
                          </div>
                        </div>
                      ) : (
                        <Select
                          key={`industry-select-overlay-${isDarkMode}`}
                          isMulti
                          options={industries.map((ind) => ({
                            value: ind.name,
                            label: ind.name,
                          }))}
                          value={filters.industry.map((ind) => ({
                            value: ind,
                            label: ind,
                          }))}
                          onChange={(selected) =>
                            setFilters((prev) => ({
                              ...prev,
                              industry: selected
                                ? selected.map((s) => s.value)
                                : [],
                            }))
                          }
                          placeholder="Select industries..."
                          className="w-full"
                          classNamePrefix="react-select"
                          isDisabled={industriesLoading}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          menuPosition="fixed"
                          styles={{
                            control: (provided, state) => {
                              return {
                                ...provided,
                                minHeight: '48px',
                                fontSize: '16px',
                                borderRadius: '12px',
                                border: '2px solid',
                                borderColor: state.isFocused 
                                  ? '#3b82f6' 
                                  : (isDarkMode ? '#4b5563' : '#e5e7eb'),
                                backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                boxShadow: state.isFocused 
                                  ? '0 0 0 3px rgba(59, 130, 246, 0.1)' 
                                  : (isDarkMode ? '0 2px 4px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'),
                                '&:hover': {
                                  borderColor: '#3b82f6',
                                },
                              };
                            },
                            valueContainer: (provided) => ({
                              ...provided,
                              minHeight: '46px',
                              padding: '8px 16px',
                            }),
                            input: (provided) => {
                              return {
                                ...provided,
                                fontSize: '16px',
                                margin: '0',
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                              };
                            },
                            placeholder: (provided) => ({
                              ...provided,
                              fontSize: '16px',
                              color: '#9ca3af',
                            }),
                            menu: (provided) => {
                              return {
                                ...provided,
                                backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                                border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                                borderRadius: '12px',
                                boxShadow: isDarkMode 
                                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
                                  : '0 10px 15px -3px rgba(0,0,0,0.1)',
                                zIndex: 9999,
                              };
                            },
                            menuPortal: (provided) => ({
                              ...provided,
                              zIndex: 9999,
                            }),
                            option: (provided, state) => {
                              return {
                                ...provided,
                                backgroundColor: state.isSelected
                                  ? '#3b82f6'
                                  : state.isFocused
                                  ? (isDarkMode ? '#4b5563' : '#f3f4f6')
                                  : (isDarkMode ? '#374151' : '#ffffff'),
                                color: state.isSelected 
                                  ? '#ffffff' 
                                  : (isDarkMode ? '#f3f4f6' : '#1f2937'),
                                '&:hover': {
                                  backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                                },
                              };
                            },
                            multiValue: (provided) => ({
                              ...provided,
                              backgroundColor: '#1e40af',
                              borderRadius: '8px',
                              padding: '4px 8px',
                            }),
                            multiValueLabel: (provided) => ({
                              ...provided,
                              color: '#ffffff',
                              fontSize: '14px',
                            }),
                            multiValueRemove: (provided) => ({
                              ...provided,
                              color: '#ffffff',
                              '&:hover': {
                                backgroundColor: '#1e3a8a',
                                color: '#ffffff',
                              },
                            }),
                            singleValue: (provided) => {
                              return {
                                ...provided,
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                              };
                            },
                          }}
                        />
                      )}
                    </div>

                    <button
                      onClick={handleClearFilters}
                      className="w-full py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default JobList;
