import React, { useEffect, useState, useMemo, useCallback } from "react";
import axiosInstance from "../../axiosInstance";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CompanySidebar from "../../components/Company/CompanySidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaSearch, FaPlus, FaSpinner, FaCalendar, FaMapMarkerAlt, FaBriefcase, FaClock } from "react-icons/fa";
import debounce from "lodash.debounce";
import LocationInput from "../../components/LocationInput";

// Utility function to format date as DD/MM/YYYY
const formatDateDMY = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const Filters = ({ filters, setFilters }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value) => {
    setFilters((prev) => ({ ...prev, location: value }));
  };

  // Determine if any filter is active for showing Clear button state
  const hasActiveFilters = Boolean(filters.title || filters.location || filters.jobType || filters.status);

  return (
    <motion.div
      className="bg-white p-3 rounded-lg shadow-lg border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FaSearch className="text-gray-900 text-xs" />
          <span>Filter Jobs</span>
        </h2>
        <button
          type="button"
          onClick={() => setFilters({ title: "", location: "", jobType: "", status: "" })}
          className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-colors ${hasActiveFilters ? 'text-gray-700 border-gray-300 hover:bg-gray-50' : 'text-gray-400 border-gray-200 cursor-not-allowed'}`}
          disabled={!hasActiveFilters}
          aria-label="Clear all filters"
          title="Clear all filters"
        >
          Clear Filters
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <label
            htmlFor="title"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Job Title
          </label>
          <div className="relative">
            <FaSearch className="absolute top-2.5 left-2.5 text-gray-400 text-xs" />
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Search by title"
              value={filters.title}
              onChange={handleChange}
              className="pl-8 pr-2 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-xs"
              aria-label="Search by job title"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="location-filter"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Location
          </label>
          <LocationInput
            value={filters.location}
            onChange={handleLocationChange}
            placeholder="Search by location"
            className="p-2 text-xs"
          />
        </div>
        <div>
          <label
            htmlFor="jobType"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Job Type
          </label>
          <select
            id="jobType"
            name="jobType"
            value={filters.jobType}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-xs"
            aria-label="Select job type"
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Temporary">Temporary</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="status"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white text-xs"
            aria-label="Select job status"
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="DeadlineReached">Deadline Reached</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

const JobListTable = ({ jobs, onView, onUpdate, onDelete, onScroll, isLoadingMore, totalJobs }) => (
  <div className="flex-1 overflow-auto rounded-lg border border-gray-200 shadow-lg bg-white" onScroll={onScroll}>
    <table className="w-full bg-white text-xs">
      <thead className="bg-gray-900 text-white sticky top-0 z-10">
        <tr>
          <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '150px'}}>Job Title</th>
          <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '110px'}}>Location</th>
          <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '90px'}}>Job Type</th>
          <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '90px'}}>Posted</th>
          <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '90px'}}>Deadline</th>
          <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '80px'}}>Applicants</th>
          <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '120px'}}>Status</th>
          <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '200px'}}>Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <AnimatePresence>
          {jobs.map((job) => {
            const locationValue =
              typeof job.location === "string" && job.location.trim().length
                ? job.location.trim()
                : "Not provided";
            const cityOnly = locationValue.split(',')[0]?.trim() || locationValue;
            const displayLocation = cityOnly.length > 15 ? `${cityOnly.slice(0, 15)}...` : cityOnly;

            const effectiveStatus = job.effectiveStatus || job.status;
            const isDeadlinePassed = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();

            return (
              <motion.tr
                key={job._id}
                className="hover:bg-gray-50 transition-colors duration-150"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <td className="px-2 py-3">
                  <div className="flex items-center">
                    <FaBriefcase className="text-gray-900 mr-2 flex-shrink-0 text-xs" />
                    <span className="text-xs font-semibold text-gray-900 truncate" style={{maxWidth: '140px'}} title={job.jobTitle || "Untitled"}>
                      {job.jobTitle || "Untitled"}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center text-xs text-gray-600" title={locationValue}>
                    <FaMapMarkerAlt className="text-gray-400 mr-1.5 flex-shrink-0 text-xs" />
                    <span className="truncate">{displayLocation}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded whitespace-nowrap inline-block">
                    {job.jobType}
                  </span>
                </td>
                <td className="px-2 py-3 text-center text-xs text-gray-600 whitespace-nowrap">
                  {formatDateDMY(job.createdAt)}
                </td>
                <td className="px-2 py-3 text-center text-xs whitespace-nowrap">
                  {job.applicationDeadline ? (
                    <span className={isDeadlinePassed ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {formatDateDMY(job.applicationDeadline)}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-2 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white font-bold text-xs">
                    {job.applicationCount ?? 0}
                  </span>
                </td>
                <td className="px-2 py-3 text-center">
                  {effectiveStatus === "Open" ? (
                    <span className="px-3 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full inline-flex items-center whitespace-nowrap">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                      Open
                    </span>
                  ) : effectiveStatus === "DeadlineReached" ? (
                    <span className="px-3 py-1 text-xs font-bold text-amber-700 bg-amber-100 rounded-full inline-flex items-center whitespace-nowrap">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                      Deadline
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full inline-flex items-center whitespace-nowrap">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                      Closed
                    </span>
                  )}
                </td>
                <td className="px-2 py-3">
                  <div className="flex justify-center gap-1.5">
                    <motion.button
                      onClick={() => onView(job)}
                      className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`View job ${job.jobTitle}`}
                    >
                      View
                    </motion.button>
                    <motion.button
                      onClick={() => onUpdate(job._id)}
                      className="px-2.5 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Edit job ${job.jobTitle}`}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      onClick={() => onDelete(job._id)}
                      className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Delete job ${job.jobTitle}`}
                    >
                      Delete
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </tbody>
    </table>
    {isLoadingMore && (
      <div className="text-center py-3 bg-gray-50 sticky bottom-0">
        <FaSpinner className="animate-spin text-gray-600 inline-block text-sm" />
        <span className="ml-2 text-xs text-gray-600">Loading more jobs...</span>
      </div>
    )}
    {!isLoadingMore && jobs.length < totalJobs && (
      <div className="text-center py-2 text-xs text-gray-600 bg-gray-50 sticky bottom-0">
        Showing {jobs.length} of {totalJobs} • Scroll down for more
      </div>
    )}
  </div>
);

const PostedJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    title: "",
    location: "",
    jobType: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axiosInstance.get("/jobs/posted");
        // Process jobs to add effectiveStatus
        const now = new Date();
        const processedJobs = res.data.map(job => {
          let effectiveStatus = job.status || "Open";
          if (job.status === "Open" && job.applicationDeadline && new Date(job.applicationDeadline) < now) {
            effectiveStatus = "DeadlineReached";
          } else if (job.status === "Closed") {
            effectiveStatus = "Closed";
          }
          return {
            ...job,
            effectiveStatus
          };
        });
        const sorted = processedJobs.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setJobs(sorted);
      } catch (err) {
        if (err.response?.status === 401) navigate("/company/login");
        else setError("Failed to fetch jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [navigate]);

  // Debounced filter function
  const filterJobs = useMemo(
    () =>
      debounce((filters, jobs, setFilteredJobs) => {
        let result = jobs;
        if (filters.title) {
          result = result.filter((j) =>
            j.jobTitle.toLowerCase().includes(filters.title.toLowerCase())
          );
        }
        if (filters.location) {
          result = result.filter((j) =>
            j.location && j.location.toLowerCase().includes(filters.location.toLowerCase())
          );
        }
        if (filters.jobType) {
          result = result.filter((j) => j.jobType === filters.jobType);
        }
        if (filters.status) {
          result = result.filter((j) => {
            const effectiveStatus = j.effectiveStatus || j.status;
            return effectiveStatus === filters.status;
          });
        }
        setFilteredJobs(result);
      }, 300),
    []
  );

  const [filteredJobs, setFilteredJobs] = useState(jobs);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [filters]);

  useEffect(() => {
    filterJobs(filters, jobs, setFilteredJobs);
    return () => filterJobs.cancel();
  }, [filters, jobs, filterJobs]);

  const handleView = (job) =>
    navigate(`/company-jobs/${job._id}`, { state: { job } });

  const handleUpdate = (id) => navigate(`/company/jobs/${id}/edit`);
  // Company status toggle removed by policy — handled by admin only


  const handleDelete = async (id) => {
    if (!id || id.length !== 24) {
      toast.error("Invalid Job ID format.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axiosInstance.delete(`/jobs/${id}`);
        const remaining = jobs.filter((j) => j._id !== id);
        setJobs(remaining);
        toast.success("Job deleted successfully!");
      } catch (err) {
        const code = err.response?.status;
        if (code === 404) toast.error("Job not found or already deleted.");
        else if (code === 403) toast.error("Unauthorized to delete this job.");
        else toast.error("Failed to delete job. Please try again.");
      }
    }
  };

  // Display jobs with infinite scroll
  const displayedJobs = useMemo(() => {
    return filteredJobs.slice(0, displayCount);
  }, [filteredJobs, displayCount]);

  // Scroll handler for infinite loading
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoadingMore && displayCount < filteredJobs.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + 20, filteredJobs.length));
        setIsLoadingMore(false);
      }, 300);
    }
  }, [displayCount, filteredJobs.length, isLoadingMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          className="text-gray-600 text-lg flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaSpinner className="animate-spin" />
          <span>Loading jobs...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          className="text-red-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {error}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <CompanySidebar />
      <div className="flex-1 md:ml-80 overflow-hidden">
        <div className="h-screen flex flex-col p-3 md:p-4">
          {/* Page Header */}
            <div className="mb-3 flex-shrink-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-0.5">Posted Jobs</h1>
                <p className="text-xs text-gray-600">
                  Manage and track all your job postings • Total: {jobs.length} | 
                  Showing: {displayedJobs.length}
                </p>
              </div>
              <motion.button
                onClick={() => navigate("/company/jobs")}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 text-xs font-medium shadow-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaPlus className="text-xs" />
                <span>Create New Job</span>
              </motion.button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-3 flex-shrink-0">
            <Filters filters={filters} setFilters={setFilters} />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {displayedJobs.length === 0 ? (
              <motion.div
                className="bg-white rounded-lg shadow-xl border border-gray-200 h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center p-12">
                  <FaBriefcase className="text-gray-300 text-6xl mb-4 mx-auto" />
                  <p className="text-xl font-semibold text-gray-700 mb-2">No jobs found</p>
                  <p className="text-sm text-gray-500">
                    {jobs.length === 0 
                      ? "Start by creating your first job posting" 
                      : "Try adjusting your filters"}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="bg-white rounded-lg shadow-xl border border-gray-200 h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex-1 overflow-hidden flex flex-col">
                  <JobListTable
                    jobs={displayedJobs}
                    onView={handleView}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onScroll={handleScroll}
                    isLoadingMore={isLoadingMore}
                    totalJobs={filteredJobs.length}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default PostedJobsPage;
