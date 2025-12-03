// Utility to format date as DD/MM/YYYY
function formatDateDMY(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date)) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiCheck,
  FiX,
  FiTrash2,
  FiStar,
  FiPlus,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiBriefcase,
  FiUsers,
  FiMail,
  FiBell,
  FiInfo,
  FiDollarSign,
  FiMapPin,
  FiMonitor,
  FiActivity,
  FiGift,
  FiTool,
  FiCopy,
  FiExternalLink
} from "react-icons/fi";
import AdminLayout from "../../components/AdminLayout";
import axios from "../../api/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { connectSocket, getSocket } from "../../utils/socket";

// Enable relative time plugin
dayjs.extend(relativeTime);
import EnhancedSkeleton from "../../components/admin/EnhancedSkeleton";
import { useDebounce, useSort } from "../../hooks/usePerformanceOptimizations";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5,
};

const AdminJobManagement = () => {
  // Modal states for confirmations
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'info' // 'info', 'warning', 'danger'
  });

  // Real-time notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Enhanced state management with better spacing
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Core data states
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [selectAllPlatform, setSelectAllPlatform] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Search and filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFields, setSearchFields] = useState({
    title: true,
    company: true,
    description: true,
    requirements: true,
    skills: true,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);

  // Infinite scroll states
  const [displayCount, setDisplayCount] = useState(20);
  const [totalJobs, setTotalJobs] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  // Performance optimizations
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Initialize sort after filteredJobs is available
  const sort = useSort(filteredJobs || [], "createdAt", "desc");

  // Memoized options to prevent unnecessary re-renders
  const statusOptions = useMemo(() => [
    { value: "all", label: "All Status", color: "text-gray-600", bgColor: "bg-gray-100" },
    { value: "Open", label: "Open", color: "text-green-600", bgColor: "bg-green-100" },
    { value: "DeadlineReached", label: "Deadline Reached", color: "text-amber-600", bgColor: "bg-amber-100" },
    { value: "Closed", label: "Closed", color: "text-red-600", bgColor: "bg-red-100" },
  ], []);

  const typeOptions = useMemo(() => [
    { value: "all", label: "All Types" },
    { value: "full-time", label: "Full Time" },
    { value: "part-time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "remote", label: "Remote" },
  ], []);

  const dateOptions = useMemo(() => [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "3months", label: "Last 3 Months" },
  ], []);

  // Derive effective status for counts, filters and display
  const deriveEffectiveStatus = useCallback((job) => {
    if (!job) return "Closed";
    if (job.effectiveStatus) return job.effectiveStatus;
    const raw = job.status;
    const hasDeadline = !!job.applicationDeadline;
    const isPastDeadline = hasDeadline ? dayjs(job.applicationDeadline).isBefore(dayjs(), 'day') : false;
    if (raw === 'Closed' || raw === 'rejected') return 'Closed';
    if (raw === 'DeadlineReached') return 'DeadlineReached';
    if (raw === 'Open' || raw === 'approved') return isPastDeadline ? 'DeadlineReached' : 'Open';
    // For other states (pending/featured etc.), just reflect deadline if present
    return isPastDeadline ? 'DeadlineReached' : (raw || 'Closed');
  }, []);

  // Memoized header statistics to prevent unnecessary recalculations
  const headerStats = useMemo(() => ({
    totalJobs,
    openCount: jobs.filter(job => deriveEffectiveStatus(job) === "Open").length,
    deadlineReachedCount: jobs.filter(job => deriveEffectiveStatus(job) === "DeadlineReached").length,
    closedCount: jobs.filter(job => deriveEffectiveStatus(job) === "Closed").length,
  }), [totalJobs, jobs, deriveEffectiveStatus]);

  // Real-time notification system with duplicate prevention
  const addNotification = useCallback((type, message, action = null) => {
    // Prevent duplicate notifications
    const isDuplicate = notifications.some(
      notification => notification.type === type && notification.message === message
    );

    if (isDuplicate) return;

    const notification = {
      id: Date.now() + Math.random(), // More unique ID
      type,
      message,
      action,
      timestamp: dayjs(),
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications

    // Auto-hide notification after 4 seconds for better UX
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 4000);
  }, [notifications]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Enhanced data fetching with real-time updates
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const adminToken = localStorage.getItem("adminToken");

    try {
      const response = await axios.get("/admin/jobs", {
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true,
      });

      const jobsData = response.data || [];
      setJobs(jobsData);
      setTotalJobs(jobsData.length);
      setRetryCount(0);

      // Only show notification for manual refresh, not on initial load
      // Notification is now handled in the refresh useEffect
    } catch (err) {
      console.error("Error fetching jobs:", err);
      addNotification('error', 'Failed to load jobs. Please try again.');

      // Enhanced error handling with retry mechanism
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchJobs(), 1000 * (retryCount + 1));
        return;
      }

      setError("Failed to load jobs. Please try again later.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [retryCount, addNotification]);

  useEffect(() => {
    fetchJobs();
  }, []); // Only run on mount

  // Connect socket for real-time updates and listen for job updates
  useEffect(() => {
    try {
      const adminRaw = localStorage.getItem("admin");
      const admin = adminRaw ? JSON.parse(adminRaw) : null;
      const userId = admin?._id || admin?.id || null;
      const socket = connectSocket(userId);

      const onJobUpdate = (update) => {
        // update: { jobId, status, featured, deleted }
        if (!update) return;
        const { jobId, status, featured, deleted } = update;

        // Update jobs state
        setJobs((prev) => {
          if (deleted) {
            // Remove the job if it was deleted
            return prev.filter((j) => j._id !== jobId);
          }
          // Update job status and featured status
          return prev.map((j) => {
            if (j._id === jobId) {
              return {
                ...j,
                status: status ?? j.status,
                featured: typeof featured !== 'undefined' ? featured : j.featured
              };
            }
            return j;
          });
        });

        // Update filtered jobs state
        setFilteredJobs((prev) => {
          if (deleted) {
            // Remove the job if it was deleted
            return prev.filter((j) => j._id !== jobId);
          }
          // Update job status and featured status
          return prev.map((j) => {
            if (j._id === jobId) {
              return {
                ...j,
                status: status ?? j.status,
                featured: typeof featured !== 'undefined' ? featured : j.featured
              };
            }
            return j;
          });
        });

        // Show appropriate notification based on the update type
        if (deleted) {
          addNotification('info', 'Job has been deleted');
        } else if (typeof featured !== 'undefined') {
          addNotification(
            'success',
            featured ? 'Job has been featured' : 'Job has been unfeatured'
          );
        } else if (status) {
          const statusMessages = {
            'Open': 'Job has been activated',
            'Closed': 'Job is closed',
            'DeadlineReached': 'Application deadline has passed',
            'approved': 'Job has been activated',
            'rejected': 'Job has been disabled',
            'pending': 'Job is pending review',
            'featured': 'Job has been featured'
          };
          addNotification('info', statusMessages[status] || `Job status updated to ${status}`);
        }
      };

      if (socket && socket.on) {
        socket.on('jobUpdate', onJobUpdate);
      }

      return () => {
        try {
          const s = getSocket();
          if (s && s.off) {
            s.off('jobUpdate', onJobUpdate);
          }
        } catch (e) {
          console.error('Error cleaning up socket listener:', e);
        }
      };
    } catch (e) {
      console.error('Socket connection failed:', e);
    }
  }, [addNotification]);

  // Separate effect for manual refresh
  useEffect(() => {
    if (isRefreshing) {
      fetchJobs();
      // Show success notification only for manual refresh
      addNotification('info', 'Refreshing jobs...');
    }
  }, [isRefreshing, fetchJobs, addNotification]);

  // Create a stable dependency for searchFields
  const searchFieldsString = JSON.stringify(searchFields);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...jobs];

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(job => performAdvancedSearch(job, debouncedSearchTerm));
    }

    // Status filter (use effective status)
    if (statusFilter !== "all") {
      filtered = filtered.filter(job => deriveEffectiveStatus(job) === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(job => job.type === typeFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = dayjs();
      filtered = filtered.filter(job => {
        const jobDate = dayjs(job.createdAt || job.postedAt);
        switch (dateFilter) {
          case "today":
            return jobDate.isSame(now, "day");
          case "week":
            return jobDate.isAfter(now.subtract(1, "week"));
          case "month":
            return jobDate.isAfter(now.subtract(1, "month"));
          case "3months":
            return jobDate.isAfter(now.subtract(3, "months"));
          default:
            return true;
        }
      });
    }

    setFilteredJobs(filtered);
    setTotalJobs(filtered.length);
    setDisplayCount(20); // Reset display count when filters change
  }, [jobs, debouncedSearchTerm, searchFieldsString, statusFilter, typeFilter, dateFilter, deriveEffectiveStatus]);

  // Infinite scroll logic
  const displayedJobs = sort.slice(0, displayCount);
  
  useEffect(() => {
    setHasMore(displayCount < sort.length);
  }, [displayCount, sort.length]);

  // Professional job actions with notifications
  const handleJobAction = async (action, jobId) => {
    const adminToken = localStorage.getItem("adminToken");

    // Validate admin token
    if (!adminToken || adminToken === "null" || adminToken === "undefined") {
      toast.error("Please log in as admin to perform this action");
      return false;
    }

    try {
      let endpoint = "";
      let method = "patch";
      let data = {};
      let successMessage = "";

      switch (action) {
        // Admin routes expect approve/reject for activating/deactivating
        case "enable":
          endpoint = `/admin/jobs/${jobId}/approve`;
          method = "patch";
          successMessage = "Job activated successfully! Company has been notified.";
          break;
        case "disable":
          endpoint = `/admin/jobs/${jobId}/reject`;
          method = "patch";
          successMessage = "Job closed successfully. Company has been notified.";
          break;
        case "feature":
          endpoint = `/admin/jobs/${jobId}/feature`;
          method = "patch";
          successMessage = "Job added to featured successfully!";
          break;
        case "unfeature":
          endpoint = `/admin/jobs/${jobId}/unfeature`;
          method = "patch";
          successMessage = "Job removed from featured successfully!";
          break;
        case "delete":
          endpoint = `/admin/jobs/${jobId}`;
          method = "delete";
          successMessage = "Job deleted successfully! Company has been notified.";
          break;
        default:
          return false;
      }

      // Execute request
      if (method === "delete") {
        await axios.delete(endpoint, {
          headers: { Authorization: `Bearer ${adminToken}` },
          withCredentials: true,
        });
      } else {
        await axios.patch(endpoint, data, {
          headers: { Authorization: `Bearer ${adminToken}` },
          withCredentials: true,
        });
      }

      // Show success notification
      toast.success(successMessage);
      addNotification('success', successMessage);
      
      // Refresh jobs list
      await fetchJobs();
      
      return true; // Return success status
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/login";
      } else if (error.response?.status === 404) {
        toast.error("Job not found. It may have been already deleted.");
        await fetchJobs();
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Invalid request. Please try again.");
      } else {
        toast.error(`Failed to ${action} job. Please try again.`);
        addNotification('error', `Failed to ${action} job`);
      }
      
      return false;
    }
  };

  // Bulk operations with notifications
  const handleBulkAction = async (action) => {
    if (selectedJobs.size === 0) {
      toast.warning("No jobs selected");
      return;
    }

    const adminToken = localStorage.getItem("adminToken");
    
    // Validate admin token
    if (!adminToken || adminToken === "null" || adminToken === "undefined") {
      toast.error("Please log in as admin to perform this action");
      return;
    }

    const jobIds = Array.from(selectedJobs);
    const actionLabels = {
      enable: "activate",
      disable: "disable",
      delete: "delete"
    };

    try {
      toast.info(`Processing ${jobIds.length} job(s)...`);

      // Backend doesn't expose a bulk jobs endpoint; perform per-job requests in parallel
      const promises = jobIds.map((id) => {
        switch (action) {
          case "enable":
            return axios.patch(`/admin/jobs/${id}/approve`, {}, {
              headers: { Authorization: `Bearer ${adminToken}` },
              withCredentials: true,
            });
          case "disable":
            return axios.patch(`/admin/jobs/${id}/reject`, {}, {
              headers: { Authorization: `Bearer ${adminToken}` },
              withCredentials: true,
            });
          case "delete":
            return axios.delete(`/admin/jobs/${id}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
              withCredentials: true,
            });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);

      // Show success notification
      const bulkActionMessages = {
        enable: `${selectedJobs.size} job(s) activated successfully! Companies have been notified.`,
        disable: `${selectedJobs.size} job(s) closed successfully. Companies have been notified.`,
        expire: `${selectedJobs.size} job(s) marked as deadline reached.`,
        delete: `${selectedJobs.size} job(s) deleted successfully! Companies have been notified.`,
      };

      toast.success(bulkActionMessages[action] || 'Bulk action completed successfully');
      addNotification('success', bulkActionMessages[action] || 'Bulk action completed successfully');
      
      setSelectedJobs(new Set());
      setSelectAllPlatform(false);
      await fetchJobs();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/login";
      } else {
        toast.error(`Failed to ${actionLabels[action]} selected jobs. Please try again.`);
        addNotification('error', `Failed to ${actionLabels[action]} selected jobs`);
      }
    }
  };

  // Memoized event handlers
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setIsRefreshing(true);
  }, []);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
  }, []);

  const toggleSelectAllPlatform = useCallback(() => {
    if (selectAllPlatform) {
      // Deselect all jobs
      setSelectedJobs(new Set());
      setSelectAllPlatform(false);
    } else {
      // Select all jobs across the platform
      const allJobIds = filteredJobs.map(job => job._id);
      setSelectedJobs(new Set(allJobIds));
      setSelectAllPlatform(true);
    }
  }, [selectAllPlatform, filteredJobs]);

  const toggleSelectAll = useCallback(() => {
    if (selectedJobs.size === displayedJobs.length) {
      setSelectedJobs(new Set());
      setSelectAllPlatform(false);
    } else {
      setSelectedJobs(new Set(displayedJobs.map(job => job._id)));
      // If all displayed jobs are selected, check if we should enable platform-wide selection
      if (displayedJobs.length === filteredJobs.length) {
        setSelectAllPlatform(true);
      }
    }
  }, [selectedJobs.size, displayedJobs, filteredJobs.length]);

  const handleViewJob = useCallback((job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  }, []);

  const closeJobModal = useCallback(() => {
    setShowJobModal(false);
    setSelectedJob(null);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setDisplayCount(prev => Math.min(prev + 20, sort.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
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
  }, [hasMore, loading, sort.length]);

  // Enhanced search function with field-specific search (memoized)
  const performAdvancedSearch = useCallback((job, searchTerm) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const enabledFields = Object.keys(searchFields).filter(field => searchFields[field]);

    return enabledFields.some(field => {
      switch (field) {
        case 'title':
          return job.title?.toLowerCase().includes(searchLower);
        case 'company':
          return job.companyName?.toLowerCase().includes(searchLower);
        case 'description':
          return job.description?.toLowerCase().includes(searchLower);
        case 'requirements':
          return job.requirements?.toLowerCase().includes(searchLower);
        case 'skills':
          return job.skills?.some(skill =>
            skill.toLowerCase().includes(searchLower)
          );
        default:
          return false;
      }
    });
  }, [searchFields]);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      "Open": <FiCheckCircle className="w-3 h-3" />,
      "DeadlineReached": <FiClock className="w-3 h-3" />,
      "Closed": <FiX className="w-3 h-3" />,
      pending: <FiClock className="w-3 h-3" />,
      approved: <FiCheckCircle className="w-3 h-3" />,
      rejected: <FiX className="w-3 h-3" />,
      featured: <FiStar className="w-3 h-3" />,
      expired: <FiAlertCircle className="w-3 h-3" />,
    };
    return icons[status] || <FiClock className="w-3 h-3" />;
  }, []);

  const getNotificationIcon = (type) => {
    const icons = {
      success: <FiCheckCircle className="w-4 h-4 text-green-500" />,
      error: <FiAlertCircle className="w-4 h-4 text-red-500" />,
      info: <FiInfo className="w-4 h-4 text-blue-500" />,
      warning: <FiAlertCircle className="w-4 h-4 text-yellow-500" />,
    };
    return icons[type] || icons.info;
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: "bg-green-50 border-green-200",
      error: "bg-red-50 border-red-200",
      info: "bg-blue-50 border-blue-200",
      warning: "bg-yellow-50 border-yellow-200",
    };
    return colors[type] || colors.info;
  };

  const getStatusColor = useCallback((status) => {
    const colors = {
      "Open": "bg-green-100 text-green-800 border-green-200",
      "DeadlineReached": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Closed": "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      featured: "bg-purple-100 text-purple-800 border-purple-200",
      expired: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  }, []);

  // Real-time notification panel (memoized to prevent unnecessary re-renders)
  const NotificationPanel = React.memo(() => (
    <AnimatePresence>
      {showNotifications && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 space-y-2"
        >
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-4 rounded-lg border shadow-lg ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </p>
                  {notification.action && (
                    <button
                      onClick={() => {
                        notification.action();
                        dismissNotification(notification.id);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1"
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  ));

  return (
    <AdminLayout>
      {/* Toast Notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen"
      >
        {/* Real-time Notifications */}
        <NotificationPanel />

        {/* Confirmation Dialog */}
        {typeof document !== 'undefined' && confirmDialog.isOpen && createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-50"
            >
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                confirmDialog.type === 'danger' ? 'bg-red-100' :
                confirmDialog.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                {confirmDialog.type === 'danger' ? (
                  <FiTrash2 className="w-6 h-6 text-red-600" />
                ) : confirmDialog.type === 'warning' ? (
                  <FiAlertCircle className="w-6 h-6 text-yellow-600" />
                ) : (
                  <FiStar className="w-6 h-6 text-blue-600" />
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                {confirmDialog.title}
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                {confirmDialog.message}
              </p>
              
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    confirmDialog.onConfirm?.();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  }}
                  className={`px-4 py-2 rounded-xl font-medium text-white transition-colors ${
                    confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                    confirmDialog.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

        {/* Job Details Modal rendered in a portal to span the full viewport */}
        {typeof document !== 'undefined' && showJobModal && selectedJob && createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/70 via-gray-900/80 to-black/90 backdrop-blur-sm" onClick={closeJobModal} />
              <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: -20 }}
                className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl p-6 sm:p-8 z-10 border border-white/20"
              >
                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeJobModal}
                  className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors duration-200 z-20"
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
                <div className="flex items-start justify-between gap-4 relative">
                  <div className="flex-1 pr-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm pt-2 pb-4 mb-4 border-b z-10">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">{selectedJob.title || 'Untitled Job'}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <FiBriefcase className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-base text-gray-700 font-medium">{selectedJob.companyName || 'Unknown Company'}</div>
                        <span className="text-gray-400">•</span>
                        <div className="text-sm text-gray-500">
                          Posted {formatDateDMY(selectedJob.createdAt || selectedJob.postedAt)}
                          <span className="text-gray-400 mx-1">•</span>
                          {dayjs(selectedJob.createdAt || selectedJob.postedAt).fromNow()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="prose prose-sm max-w-none">
                          <div className="text-base text-gray-700 leading-relaxed">{selectedJob.description || 'No description available'}</div>
                        </div>

                        {selectedJob.responsibilities && (
                          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border shadow-sm">
                            <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <FiCheckCircle className="w-4 h-4 text-green-500" />
                              Responsibilities
                            </h4>
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedJob.responsibilities}</div>
                          </div>
                        )}

                        {selectedJob.qualifications && (
                          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border shadow-sm">
                            <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <FiStar className="w-4 h-4 text-yellow-500" />
                              Qualifications
                            </h4>
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedJob.qualifications}</div>
                          </div>
                        )}

                        {selectedJob.benefits && (
                          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border shadow-sm">
                            <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <FiGift className="w-4 h-4 text-purple-500" />
                              Benefits
                            </h4>
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedJob.benefits}</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {selectedJob.skills && selectedJob.skills.length > 0 && (
                          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border shadow-sm">
                            <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FiTool className="w-4 h-4 text-blue-500" />
                              Required Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedJob.skills.map((s, i) => (
                                <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border shadow-sm">
                          <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FiInfo className="w-4 h-4 text-indigo-500" />
                            Job Details
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">Type</div>
                                <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                  <FiBriefcase className="w-4 h-4 text-gray-400" />
                                  <span className="capitalize">{selectedJob.type || 'Not specified'}</span>
                                </div>
                              </div>

                              <div>
                                <div className="text-sm font-medium text-gray-900">Experience</div>
                                <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                  <FiUsers className="w-4 h-4 text-gray-400" />
                                  {selectedJob.experienceLevel || 'Not specified'}
                                </div>
                              </div>

                              <div>
                                <div className="text-sm font-medium text-gray-900">Industry</div>
                                <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                  <FiActivity className="w-4 h-4 text-gray-400" />
                                  {selectedJob.industry || 'Not specified'}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">Location</div>
                                <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                  <FiMapPin className="w-4 h-4 text-gray-400" />
                                  {selectedJob.location || 'Not specified'}
                                </div>
                              </div>

                              <div>
                                <div className="text-sm font-medium text-gray-900">Deadline</div>
                                <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                  <FiCalendar className="w-4 h-4 text-gray-400" />
                                  {selectedJob.applicationDeadline ? formatDateDMY(selectedJob.applicationDeadline) : 'None'}
                                </div>
                              </div>

                              <div>
                                <div className="text-sm font-medium text-gray-900">Remote Work</div>
                                <div className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                  <FiMonitor className="w-4 h-4 text-gray-400" />
                                  {selectedJob.remoteOption ? (selectedJob.remoteOption === true ? 'Remote' : String(selectedJob.remoteOption)) : 'Not specified'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border shadow-sm">
                          <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FiMail className="w-4 h-4 text-indigo-500" />
                            Contact Information
                          </h4>
                          <a href={`mailto:${selectedJob.contactEmail || ''}`} 
                             className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 group">
                            <FiMail className="w-4 h-4" />
                            {selectedJob.contactEmail || 'Not provided'}
                            {selectedJob.contactEmail && <FiExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-72 shrink-0">
                    <div className="flex flex-col items-stretch gap-3">
                      <div className="p-3 rounded-lg border bg-white">
                        <div className="flex items-center justify-between">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border-2 min-w-[140px] justify-center whitespace-nowrap ${getStatusColor(deriveEffectiveStatus(selectedJob))}`}>
                            {getStatusIcon(deriveEffectiveStatus(selectedJob))}
                            <span>{deriveEffectiveStatus(selectedJob) === 'DeadlineReached' ? 'Deadline Reached' : deriveEffectiveStatus(selectedJob)}</span>
                          </div>
                          {selectedJob.featured && <FiStar className="text-yellow-500" />}
                        </div>

                        <div className="mt-3 text-sm text-gray-700">
                          <div className="text-xs text-gray-500">Salary</div>
                          <div className="font-medium">{selectedJob.salaryRange ? (selectedJob.salaryRange.min || selectedJob.salaryRange.max ? `${selectedJob.salaryRange.min || 0} - ${selectedJob.salaryRange.max || 0}` : String(selectedJob.salaryRange)) : (selectedJob.salary ? String(selectedJob.salary) : 'Not specified')}</div>
                        </div>

                        <div className="mt-3 text-sm text-gray-700">
                          <div className="text-xs text-gray-500">Contact Email</div>
                          <a href={`mailto:${selectedJob.contactEmail || ''}`} className="font-medium text-indigo-700 break-all">{selectedJob.contactEmail || 'Not provided'}</a>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          Created: {formatDateDMY(selectedJob.createdAt || selectedJob.postedAt)}
                        </div>
                        <div className="text-xs text-gray-500">Updated: {selectedJob.updatedAt ? formatDateDMY(selectedJob.updatedAt) : '—'}</div>
                      </div>

                      <div className="p-3 rounded-lg border bg-white flex flex-col gap-2">
                        {selectedJob.status === 'approved' || selectedJob.status === 'Open' ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Disable Job?',
                                message: `Are you sure you want to disable "${selectedJob.title}"? The company will be notified.`,
                                type: 'warning',
                                onConfirm: async () => {
                                  await handleJobAction('disable', selectedJob._id);
                                  closeJobModal();
                                }
                              });
                            }}
                            className="w-full px-3 py-2 bg-orange-100 text-orange-800 rounded-lg"
                          >
                            Disable Job
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Activate Job?',
                                message: `Are you sure you want to activate "${selectedJob.title}"? The company will be notified.`,
                                type: 'info',
                                onConfirm: async () => {
                                  await handleJobAction('enable', selectedJob._id);
                                  closeJobModal();
                                }
                              });
                            }}
                            className="w-full px-3 py-2 bg-blue-100 text-blue-800 rounded-lg"
                          >
                            Activate Job
                          </motion.button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: selectedJob.status === 'featured' ? 'Remove from Featured?' : 'Add to Featured?',
                              message: selectedJob.status === 'featured'
                                ? `Remove "${selectedJob.title}" from featured jobs?`
                                : `Add "${selectedJob.title}" to featured jobs? It will appear prominently to users.`,
                              type: 'info',
                              onConfirm: async () => {
                                await handleJobAction(selectedJob.status === 'featured' ? 'unfeature' : 'feature', selectedJob._id);
                                fetchJobs();
                              }
                            });
                          }}
                          className={`w-full px-3 py-2 rounded-lg ${selectedJob.status === 'featured' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {selectedJob.status === 'featured' ? 'Unfeature' : 'Feature'}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Delete Job?',
                              message: `Are you sure you want to delete "${selectedJob.title}"? This action cannot be undone. The company will be notified.`,
                              type: 'danger',
                              onConfirm: async () => {
                                await handleJobAction('delete', selectedJob._id);
                                closeJobModal();
                              }
                            });
                          }}
                          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg"
                        >
                          Delete Job
                        </motion.button>

                        <button
                          onClick={() => { navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(selectedJob, null, 2)); addNotification('success', 'Job JSON copied to clipboard'); }}
                          className="w-full px-3 py-2 bg-gray-50 text-gray-700 rounded-lg border"
                        >
                          Copy Job JSON
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}

        {/* Enhanced Header Section */}
        {/* Enhanced Header Section */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 lg:p-7">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-2xl"></div>

            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                    Job Management
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 mb-2">
                    Manage and moderate job postings across the platform
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                      <FiBriefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="whitespace-nowrap">{headerStats.totalJobs} Total Jobs</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <span className="whitespace-nowrap">{headerStats.openCount} Open</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <FiClock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                      <span className="whitespace-nowrap">{headerStats.deadlineReachedCount} Deadline Reached</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <FiX className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                      <span className="whitespace-nowrap">{headerStats.closedCount} Closed</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                      showFilters
                        ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-200"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <FiFilter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleManualRefresh}
                    disabled={loading}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-400 text-red-700 p-4 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? "Retrying..." : "Retry"}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Advanced Search and Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 lg:p-7"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Enhanced Search Input */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Search Jobs
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
                      className={`px-2 py-1 text-xs rounded-lg font-medium transition-all duration-200 ${
                        isAdvancedSearch
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Advanced
                    </motion.button>
                  </div>

                  {/* Advanced Search Fields */}
                  <AnimatePresence>
                    {isAdvancedSearch && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {Object.keys(searchFields).map(field => (
                            <label key={field} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={searchFields[field]}
                                onChange={(e) => setSearchFields(prev => ({
                                  ...prev,
                                  [field]: e.target.checked
                                }))}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="capitalize text-gray-600">{field}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search across selected fields..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-0 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-3 border-0 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-3 border-0 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Posted
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-3 border-0 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200"
                  >
                    {dateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Actions Bar */}
        {selectedJobs.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-5 sm:p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="font-semibold text-indigo-900 text-sm sm:text-base">
                  {selectAllPlatform ? `${filteredJobs.length} jobs selected (all filtered)` : `${selectedJobs.size} job${selectedJobs.size > 1 ? "s" : ""} selected`}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {!selectAllPlatform && filteredJobs.length > displayedJobs.length && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSelectAllPlatform}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Select All Platform
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDialog({
                    isOpen: true,
                    title: 'Activate Multiple Jobs?',
                    message: `Are you sure you want to activate ${selectedJobs.size} job(s)? Companies will be notified.`,
                    type: 'info',
                    onConfirm: () => handleBulkAction("enable")
                  })}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FiCheck className="w-4 h-4" />
                  Active
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDialog({
                    isOpen: true,
                    title: 'Disable Multiple Jobs?',
                    message: `Are you sure you want to disable ${selectedJobs.size} job(s)? Companies will be notified.`,
                    type: 'warning',
                    onConfirm: () => handleBulkAction("disable")
                  })}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FiX className="w-4 h-4" />
                  Disable
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDialog({
                    isOpen: true,
                    title: 'Delete Multiple Jobs?',
                    message: `Are you sure you want to delete ${selectedJobs.size} job(s)? This action cannot be undone. Companies will be notified.`,
                    type: 'danger',
                    onConfirm: () => handleBulkAction("delete")
                  })}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content Area with Better Spacing */}
        <div className="space-y-6">
          {/* Enhanced Loading State */}
          {loading ? (
            <div className="space-y-8 w-full">
              {/* Search and Filter Bar Skeleton */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                      <div className="h-12 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl animate-pulse shadow-sm"></div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Jobs Table Skeleton */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Job Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Posted
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {[...Array(8)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="w-4 h-4 bg-gray-300 rounded"></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
                              <div className="ml-4 flex-1 space-y-2">
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" style={{ width: `${Math.random() * 30 + 70}%` }}></div>
                                <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" style={{ width: `${Math.random() * 25 + 50}%` }}></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full" style={{ width: `${Math.random() * 20 + 60}%` }}></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" style={{ width: `${Math.random() * 25 + 50}%` }}></div>
                              <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded" style={{ width: `${Math.random() * 30 + 40}%` }}></div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {[...Array(4)].map((_, j) => (
                                <div key={j} className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 bg-gray-300 rounded" style={{ width: '120px' }}></div>
                    <div className="h-10 bg-gray-300 rounded-lg" style={{ width: '80px' }}></div>
                  </div>
                  <div className="flex items-center gap-2">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Jobs Cards - Mobile/Tablet View */}
              <div className="lg:hidden space-y-4 w-full">
                <AnimatePresence>
                  {displayedJobs.map((job) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectAllPlatform || selectedJobs.has(job._id)}
                          onChange={() => {
                            const newSelectedJobs = new Set(selectedJobs);
                            if (newSelectedJobs.has(job._id)) {
                              newSelectedJobs.delete(job._id);
                              setSelectAllPlatform(false);
                            } else {
                              newSelectedJobs.add(job._id);
                              // If all filtered jobs are now selected, enable platform-wide selection
                              if (newSelectedJobs.size === filteredJobs.length) {
                                setSelectAllPlatform(true);
                              }
                            }
                            setSelectedJobs(newSelectedJobs);
                          }}
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shadow-sm"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                                  <FiBriefcase className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                                    {job.title || "Untitled Job"}
                                  </h3>
                                  <p className="text-sm text-gray-600 font-medium">
                                    {job.companyName || "Unknown Company"}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                {job.description ? job.description.substring(0, 100) + "..." : "No description available"}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 min-w-[140px] justify-center whitespace-nowrap ${getStatusColor(deriveEffectiveStatus(job))} shadow-sm`}>
                                {getStatusIcon(deriveEffectiveStatus(job))}
                                <span className="hidden sm:inline">
                                  {deriveEffectiveStatus(job) === 'DeadlineReached' ? 'Deadline Reached' : deriveEffectiveStatus(job)}
                                </span>
                              </span>
                              <span className="text-xs text-gray-500 font-medium">
                                {formatDateDMY(job.createdAt || job.postedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FiBriefcase className="w-4 h-4 text-gray-400" />
                                <span className="capitalize">{job.type || "Not specified"}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleViewJob(job)}
                                className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                              >
                                <FiEye className="w-4 h-4" />
                                <span>View</span>
                              </motion.button>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              {job.status === "pending" && (
                                <>
                                </>
                              )}

                              {(job.status === "approved" || job.status === "Open") && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setConfirmDialog({
                                      isOpen: true,
                                      title: 'Disable Job?',
                                      message: `Are you sure you want to disable "${job.title}"? The company will be notified.`,
                                      type: 'warning',
                                      onConfirm: () => handleJobAction("disable", job._id)
                                    })}
                                    className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                                  >
                                    <FiX className="w-4 h-4" />
                                    <span>Disable</span>
                                  </motion.button>
                                </>
                              )}

                              {(job.status === "Closed" || job.status === "rejected") && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setConfirmDialog({
                                      isOpen: true,
                                      title: 'Activate Job?',
                                      message: `Are you sure you want to activate "${job.title}"? The company will be notified.`,
                                      type: 'info',
                                      onConfirm: () => handleJobAction("enable", job._id)
                                    })}
                                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                                  >
                                    <FiCheck className="w-4 h-4" />
                                    <span>Active</span>
                                  </motion.button>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setConfirmDialog({
                                  isOpen: true,
                                  title: job.status === "featured" ? 'Remove from Featured?' : 'Add to Featured?',
                                  message: job.status === "featured" 
                                    ? `Remove "${job.title}" from featured jobs?`
                                    : `Add "${job.title}" to featured jobs? It will appear prominently to users.`,
                                  type: 'info',
                                  onConfirm: () => handleJobAction(job.status === "featured" ? "unfeature" : "feature", job._id)
                                })}
                                className={`p-2 rounded-lg transition-colors ${
                                  job.status === "featured"
                                    ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100"
                                    : "text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                                }`}
                                title={job.status === "featured" ? "Remove from Featured" : "Add to Featured"}
                              >
                                {job.status === "featured" ? <FiStar className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setConfirmDialog({
                                  isOpen: true,
                                  title: 'Delete Job?',
                                  message: `Are you sure you want to delete "${job.title}"? This action cannot be undone. The company will be notified.`,
                                  type: 'danger',
                                  onConfirm: () => handleJobAction("delete", job._id)
                                })}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Job"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectAllPlatform || (displayedJobs.length > 0 && selectedJobs.size === displayedJobs.length)}
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shadow-sm"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Job Details
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Posted
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        <AnimatePresence>
                          {displayedJobs.map((job) => (
                            <tr key={job._id} className="hover:bg-gray-50/80 transition-all duration-200">
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectAllPlatform || selectedJobs.has(job._id)}
                                  onChange={() => {
                                    const newSelectedJobs = new Set(selectedJobs);
                                    if (newSelectedJobs.has(job._id)) {
                                      newSelectedJobs.delete(job._id);
                                      setSelectAllPlatform(false);
                                    } else {
                                      newSelectedJobs.add(job._id);
                                      // If all filtered jobs are now selected, enable platform-wide selection
                                      if (newSelectedJobs.size === filteredJobs.length) {
                                        setSelectAllPlatform(true);
                                      }
                                    }
                                    setSelectedJobs(newSelectedJobs);
                                  }}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shadow-sm"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                                    <FiBriefcase className="w-6 h-6 text-indigo-600" />
                                  </div>
                                  <div className="ml-4 flex-1">
                                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                                      {job.title || "Untitled Job"}
                                    </div>
                                    <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                                      {job.description ? job.description.substring(0, 60) + "..." : "No description available"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{job.companyName || "Unknown Company"}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border-2 min-w-[140px] justify-center whitespace-nowrap ${getStatusColor(deriveEffectiveStatus(job))} shadow-sm`}>
                                  {getStatusIcon(deriveEffectiveStatus(job))}
                                  {deriveEffectiveStatus(job) === 'DeadlineReached' ? 'Deadline Reached' : deriveEffectiveStatus(job)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 font-medium">
                                  {formatDateDMY(job.createdAt || job.postedAt)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {dayjs(job.createdAt || job.postedAt).fromNow()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-1">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleViewJob(job)}
                                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                    title="View Job Details"
                                  >
                                    <FiEye className="w-4 h-4" />
                                  </motion.button>

                                  {/* Status-based Actions */}
                                  {job.status === "pending" && (
                                    <>
                                    </>
                                  )}

                                  {(job.status === "approved" || job.status === "Open") && (
                                    <>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: "Disable Job?",
                                            message: "Are you sure you want to disable this job? It will no longer be visible to job seekers.",
                                            type: "warning",
                                            onConfirm: async () => {
                                              try {
                                                await handleJobAction("disable", job._id);
                                                addNotification("success", "Job has been disabled successfully");
                                              } catch (error) {
                                                console.error("Error disabling job:", error);
                                                addNotification("error", "Failed to disable job. Please try again.");
                                              }
                                            }
                                          });
                                        }}
                                        className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                        title="Disable Job"
                                      >
                                        <motion.div
                                          animate={{ scale: 1 }}
                                          whileHover={{ rotate: 90 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <FiX className="w-4 h-4" />
                                        </motion.div>
                                      </motion.button>
                                    </>
                                  )}

                                  {(job.status === "Closed" || job.status === "rejected") && (
                                    <>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: "Activate Job?",
                                            message: "Are you sure you want to activate this job? It will become visible to job seekers.",
                                            type: "info",
                                            onConfirm: async () => {
                                              try {
                                                await handleJobAction("enable", job._id);
                                                addNotification("success", "Job has been activated successfully");
                                              } catch (error) {
                                                console.error("Error activating job:", error);
                                                addNotification("error", "Failed to activate job. Please try again.");
                                              }
                                            }
                                          });
                                        }}
                                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                        title="Activate Job"
                                      >
                                        <motion.div
                                          animate={{ scale: 1 }}
                                          whileHover={{ scale: 1.2 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <FiCheck className="w-4 h-4" />
                                        </motion.div>
                                      </motion.button>
                                    </>
                                  )}

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: job.featured ? 'Remove Featured Status?' : 'Feature This Job?',
                                        message: job.featured 
                                          ? 'Are you sure you want to remove this job from featured listings? This will reduce its visibility.'
                                          : 'Are you sure you want to feature this job? Featured jobs appear prominently in search results and recommendations.',
                                        type: 'warning',
                                        onConfirm: async () => {
                                          try {
                                            const action = job.featured ? 'unfeature' : 'feature';
                                            await handleJobAction(action, job._id);
                                          } catch (error) {
                                            console.error(`Error ${job.featured ? 'unfeaturing' : 'featuring'} job:`, error);
                                            addNotification('error', `Failed to ${job.featured ? 'unfeature' : 'feature'} job. Please try again.`);
                                          }
                                        }
                                      });
                                    }}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                      job.featured
                                        ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 bg-yellow-50/50"
                                        : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                    }`}
                                    title={job.featured ? "Remove from Featured" : "Feature this Job"}>
                                    <motion.div
                                      animate={{ scale: job.featured ? 1.1 : 1 }}
                                      transition={{ duration: 0.2 }}>
                                      <FiStar className={`w-4 h-4 ${job.featured ? "fill-yellow-500" : ""}`} />
                                    </motion.div>
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Delete Job?',
                                        message: 'This action cannot be undone. The job posting will be permanently removed from the platform.',
                                        type: 'danger',
                                        onConfirm: async () => {
                                          try {
                                            await handleJobAction('delete', job._id);
                                          } catch (error) {
                                            console.error('Error deleting job:', error);
                                            addNotification('error', 'Failed to delete job. Please try again.');
                                          }
                                        }
                                      });
                                    }}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    title="Delete Job"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Infinite Scroll Loader */}
              {hasMore && !loading && (
                <div ref={loadMoreRef} className="mt-6 text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <FiRefreshCw className="w-6 h-6 text-indigo-600" />
                  </motion.div>
                  <p className="mt-2 text-sm text-gray-600">Loading more jobs...</p>
                </div>
              )}

              {/* Showing count */}
              {!loading && displayedJobs.length > 0 && (
                <div className="mt-6 text-center">
                  <span className="text-sm font-medium text-gray-700">
                    Showing <span className="text-indigo-600 font-semibold">{displayedJobs.length}</span> of{" "}
                    <span className="text-indigo-600 font-semibold">{sort.length}</span> jobs
                  </span>
                </div>
              )}

              {/* Empty State */}
              {!loading && displayedJobs.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 sm:py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBriefcase className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {totalJobs === 0
                      ? "No jobs have been posted yet."
                      : "No jobs match your current filters."
                    }
                  </p>
                  {(searchTerm || Object.values(searchFields).some(field => !field) || statusFilter !== "all" || typeFilter !== "all" || dateFilter !== "all") && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSearchTerm("");
                        setSearchFields({
                          title: true,
                          company: true,
                          description: true,
                          requirements: true,
                          skills: true,
                        });
                        setStatusFilter("all");
                        setTypeFilter("all");
                        setDateFilter("all");
                        setIsAdvancedSearch(false);
                      }}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Clear All Filters
                    </motion.button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminJobManagement;