import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../axiosInstance";
import CompanySidebar from "../../components/Company/CompanySidebar";
import CompanyViewProfileModal from "../../components/Company/CompanyViewProfileModal";
import Modal from "react-modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEye,
  FaCalendarCheck,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaFileCsv,
  FaSearch,
  FaCalendarAlt,
  FaCalendar,
  FaClock,
  FaSpinner,
  FaCheckSquare,
  FaSquare,
  FaInfoCircle,
  FaUser,
  FaFileAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import { Tooltip } from "react-tooltip";
import { startConversation } from "../../api/chatApi";

Modal.setAppElement("#root");

const CompanyApplicationsDashboard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [expandedJobIds, setExpandedJobIds] = useState([]);
  const [applications, setApplications] = useState({});
  const [interviews, setInterviews] = useState({});
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingInterviews, setLoadingInterviews] = useState({});
  const [error, setError] = useState("");
  const [viewProfileUserId, setViewProfileUserId] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewDate, setInterviewDate] = useState(new Date());
  const [interviewNotes, setInterviewNotes] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");
  const [isRescheduleMode, setIsRescheduleMode] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const applicationTabs = ["All", "Pending", "Interviewed", "Hired", "Rejected"];
  const [selectedApplications, setSelectedApplications] = useState({});
  const [mainTab, setMainTab] = useState("all");
  const [selectedJobTab, setSelectedJobTab] = useState(null);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [coverLetterModal, setCoverLetterModal] = useState({ open: false, text: "" });
  const [displayCount, setDisplayCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [activeTab, searchTerm, mainTab, selectedJobTab]);

  useEffect(() => {
    // Use centralized refresh so multiple actions can call this to keep UI consistent
    const fetchAllData = async () => {
      setLoadingJobs(true);
      setLoadingApplications(true);
      try {
        const res = await axiosInstance.get("/company/applications/all");
        const apps = res.data || [];
        const appsObj = {};
        const jobsObj = {};
        apps.forEach((app) => {
          const jobId = app.jobId?._id || app.jobId;
          if (!appsObj[jobId]) appsObj[jobId] = [];
          appsObj[jobId].push(app);
          if (app.jobId && !jobsObj[jobId]) jobsObj[jobId] = app.jobId;
        });
        setApplications(appsObj);
        const jobsArr = Object.values(jobsObj);
        setJobs(jobsArr);

        // Fetch interviews for all jobs in parallel
        const interviewResults = await Promise.all(
          jobsArr.map((job) => {
            const jobId = job._id || job;
            return axiosInstance
              .get(`/company/interviews/job/${jobId}`)
              .then((r) => ({ jobId, data: r.data }))
              .catch(() => ({ jobId, data: [] }));
          })
        );
        const interviewsObj = {};
        interviewResults.forEach(({ jobId, data }) => {
          interviewsObj[jobId] = data || [];
        });
        setInterviews(interviewsObj);
      } catch (err) {
        console.error("Failed to load company applications or interviews:", err);
        setError("Failed to load company applications.");
      } finally {
        setLoadingJobs(false);
        setLoadingApplications(false);
      }
    };

    // expose fetchAllData for other handlers by attaching to ref-like state
    fetchAllData();
  }, []);

  const handleSearchClick = useCallback(() => {
    setFocusedInput('search');
    // Small delay to ensure focus is set properly
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder="Search by job title, name, or email..."]');
      if (searchInput) {
        searchInput.focus();
      }
    }, 10);
  }, []);

  useEffect(() => {
    if (isScheduleModalOpen) {
      // Small delay to ensure modal is fully rendered before focusing
      const focusTimer = setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder="Add notes or instructions..."]');
        if (textarea) {
          textarea.focus();
          const len = textarea.value.length;
          textarea.setSelectionRange(len, len);
          setFocusedInput('modal-notes');
        }
      }, 150);

      return () => clearTimeout(focusTimer);
    }
  }, [isScheduleModalOpen]);

  const handleCancelInterview = async (interviewId, jobId) => {
    if (!interviewId || !jobId) {
      console.error("Missing interviewId or jobId");
      return;
    }
    
    if (!window.confirm("Are you sure you want to cancel this interview? The candidate will be notified.")) {
      return;
    }
    
    console.log("Cancelling interview:", { interviewId, jobId });
    
    try {
      const response = await axiosInstance.delete(`/company/interviews/${interviewId}`);
      console.log("Interview cancelled:", response.data);
      
      // Refresh interviews for the job and global data to keep UI consistent
      await fetchInterviews(jobId);
      // Also refresh applications/jobs to avoid stale job/app data
      try { await axiosInstance.get('/company/applications/all').then(res => {
        const apps = res.data || [];
        const appsObj = {};
        const jobsObj = {};
        apps.forEach((app) => {
          const jId = app.jobId?._id || app.jobId;
          if (!appsObj[jId]) appsObj[jId] = [];
          appsObj[jId].push(app);
          if (app.jobId && !jobsObj[jId]) jobsObj[jId] = app.jobId;
        });
        setApplications(appsObj);
        setJobs(Object.values(jobsObj));
      }) } catch(e){ console.warn('Failed refreshing all data after cancel:', e); }
      setStatusMessage("Interview cancelled successfully.");
      setStatusMessageType("success");
      setTimeout(() => {
        setStatusMessage(null);
        setStatusMessageType(null);
      }, 3000);
    } catch (err) {
      console.error("Error cancelling interview:", err);
      console.error("Error response:", err.response?.data);
      const errorMsg = err.response?.data?.message || "Failed to cancel interview. Please try again.";
      setStatusMessage(errorMsg);
      setStatusMessageType("error");
      setTimeout(() => {
        setStatusMessage(null);
        setStatusMessageType(null);
      }, 3000);
    }
  };

  const fetchInterviews = async (jobId) => {
    if (!jobId) {
      console.error("fetchInterviews called without jobId");
      return;
    }
    
    setLoadingInterviews((prev) => ({ ...prev, [jobId]: true }));
    try {
      console.log(`Fetching interviews for job: ${jobId}`);
      const interviewRes = await axiosInstance.get(`/company/interviews/job/${jobId}`);
      console.log(`Received ${interviewRes.data?.length || 0} interviews for job ${jobId}`);
      setInterviews((prev) => ({ ...prev, [jobId]: interviewRes.data || [] }));
    } catch (err) {
      console.error(`Error fetching interviews for job ${jobId}:`, err);
      console.error("Error response:", err.response?.data);
      setInterviews((prev) => ({ ...prev, [jobId]: [] }));
    } finally {
      setLoadingInterviews((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const toggleJob = async (jobId) => {
    if (expandedJobIds.includes(jobId)) {
      setExpandedJobIds(expandedJobIds.filter((id) => id !== jobId));
      setSearchTerm("");
    } else {
      setExpandedJobIds([...expandedJobIds, jobId]);
      try {
        if (!applications[jobId]) {
          const [appRes] = await Promise.all([
            axiosInstance.get(`/company/applications/${jobId}`),
            fetchInterviews(jobId),
          ]);
          setApplications((prev) => ({ ...prev, [jobId]: appRes.data }));
        } else {
          await fetchInterviews(jobId);
        }
      } catch (err) {
        console.error("Error fetching applications or interviews:", err);
        setApplications((prev) => ({ ...prev, [jobId]: [] }));
        setInterviews((prev) => ({ ...prev, [jobId]: [] }));
        setLoadingInterviews((prev) => ({ ...prev, [jobId]: false }));
      }
    }
  };

  const [statusUpdating, setStatusUpdating] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusMessageType, setStatusMessageType] = useState(null);

  const handleUpdateStatus = async (applicationId, status, jobId) => {
    // Optimistic update: find original app and update UI immediately
    const originalAppsSnapshot = { ...applications };
    // find original app across buckets
    let originalApp = null;
    let originalJobKey = null;
    for (const [key, apps] of Object.entries(applications)) {
      const found = (apps || []).find(a => a._id === applicationId);
      if (found) {
        originalApp = found;
        originalJobKey = key;
        break;
      }
    }

    // compute actual job id to call API; prefer passed jobId, else fallback to originalApp.jobId
    let actualJobId = typeof jobId === 'object' ? (jobId._id || jobId) : jobId;
    if (!actualJobId && originalApp) {
      actualJobId = originalApp.jobId?._id || originalApp.jobId;
    }

    try {
      setStatusUpdating((prev) => ({ ...prev, [applicationId]: true }));

      // optimistic UI update: set status locally so user sees immediate feedback
      if (originalJobKey) {
        setApplications(prev => {
          const updated = { ...prev };
          updated[originalJobKey] = (updated[originalJobKey] || []).map(a => a._id === applicationId ? { ...a, status } : a);
          return updated;
        });
      }

      await axiosInstance.put(`/company/applications/${applicationId}/status`, { status });

      setStatusMessage(`Application status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}.`);
      setStatusMessageType("success");

      // Refresh server-side list for this job and merge with fallbacks
      if (!actualJobId) {
        // nothing more we can do without a job id; keep optimistic change
        setTimeout(() => {
          setStatusMessage(null);
          setStatusMessageType(null);
        }, 3000);
        return;
      }

      const updatedAppsRes = await axiosInstance.get(`/company/applications/${actualJobId}`);
      let updatedAppsData = updatedAppsRes.data || [];

      // If backend omitted job info, restore jobId/jobTitle from originalApp or jobs cache
      const fallbackJobObj = (originalApp?.jobId) || jobs.find(j => (j._id || j) === actualJobId) || null;
      if (fallbackJobObj) {
        updatedAppsData = updatedAppsData.map(app => {
          try {
            if (!app.jobId) app.jobId = fallbackJobObj;
            else if (!app.jobId.jobTitle) app.jobId.jobTitle = fallbackJobObj.jobTitle || app.jobId.jobTitle || 'N/A';
          } catch (e) { /* ignore mapping errors */ }
          return app;
        });
      }

      setApplications((prev) => ({ ...prev, [actualJobId]: updatedAppsData }));

      setTimeout(() => {
        setStatusMessage(null);
        setStatusMessageType(null);
      }, 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      // revert optimistic update if available
      setApplications(originalAppsSnapshot);
      setStatusMessage("Failed to update application status. Please try again.");
      setStatusMessageType("error");
      setTimeout(() => {
        setStatusMessage(null);
        setStatusMessageType(null);
      }, 3000);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const openScheduleModal = useCallback((application, jobId) => {
    console.log("openScheduleModal called with:", { application, jobId });
    
    if (!application || !jobId) {
      setScheduleError("Cannot schedule: Invalid application or job data");
      return;
    }
    
    // Extract job ID if it's an object
    const actualJobId = typeof jobId === 'object' ? (jobId._id || jobId) : jobId;
    
    const appUserId = application.userId?._id ? application.userId._id.toString() : application.userId?.toString();
    if (!appUserId) {
      setScheduleError("Cannot schedule: Invalid user data");
      return;
    }

    console.log("Extracted IDs:", { actualJobId, appUserId });

    // Find existing interview for this application
    const existingInterview = interviews[actualJobId]?.find((interview) => {
      const interviewJobId = interview.jobId?.toString();
      const interviewUserId = interview.userId?._id ? interview.userId._id.toString() : interview.userId?.toString();
      return interviewJobId === actualJobId.toString() && interviewUserId === appUserId;
    });

    console.log("Existing interview:", existingInterview);

    // attach discovered companyId if available from jobs cache
    const jobObj = jobs.find(j => (j._id || j) === actualJobId) || null;
    const companyIdFromJob = jobObj?.companyId || jobObj?.company || null;

    setIsRescheduleMode(!!existingInterview);
    setSelectedApplication({ ...application, jobId: actualJobId, companyId: companyIdFromJob });
    setInterviewDate(existingInterview ? new Date(existingInterview.date) : new Date());
    setInterviewNotes(existingInterview ? existingInterview.notes || "" : "");
    setScheduleError("");
    setScheduleSuccess("");
    setIsScheduleModalOpen(true);
  }, [interviews, jobs]);

  const closeScheduleModal = useCallback(() => {
    setIsScheduleModalOpen(false);
    setSelectedApplication(null);
    setIsRescheduleMode(false);
    setIsScheduling(false);
    setScheduleError("");
    setScheduleSuccess("");
  }, []);

  const handleScheduleInterview = useCallback(async () => {
    if (!interviewDate) {
      setScheduleError("Please select a valid date and time");
      return;
    }
    setIsScheduling(true);
    setScheduleError("");
    setScheduleSuccess("");
    
    // Extract user ID properly
    const userIdToSend = selectedApplication.userId?._id 
      ? selectedApplication.userId._id.toString() 
      : selectedApplication.userId?.toString();
    const jobId = selectedApplication.jobId;
    const applicationId = selectedApplication._id;
    
    console.log("Scheduling interview with data:", {
      jobId,
      userId: userIdToSend,
      applicationId,
      date: interviewDate,
      notes: interviewNotes,
      selectedApplication: selectedApplication
    });
    
    if (!userIdToSend) {
      setScheduleError("Invalid user data - User ID is missing");
      setIsScheduling(false);
      return;
    }
    if (!jobId) {
      setScheduleError("Invalid job data - Job ID is missing");
      setIsScheduling(false);
      return;
    }
    if (!applicationId) {
      setScheduleError("Invalid application data - Application ID is missing");
      setIsScheduling(false);
      return;
    }
    
    try {
      const requestData = {
        jobId: jobId.toString(),
        userId: userIdToSend,
        applicationId: applicationId.toString(),
        date: interviewDate.toISOString(),
        notes: interviewNotes || "",
        // include companyId so backend can notify company as well
        companyId: selectedApplication.companyId ? selectedApplication.companyId.toString() : (jobs.find(j => (j._id || j) === jobId)?.companyId || null),
        // request server to create a shared interview link and notify both parties
        createSharedLink: true,
      };

      console.log("Sending interview schedule request:", requestData);

      const response = await axiosInstance.post("/company/interviews", requestData);

      console.log("Interview scheduled successfully:", response.data);

      // If server returned a shared link, show it to the user and copy to clipboard
      if (response.data?.sharedLink) {
        try {
          await navigator.clipboard.writeText(response.data.sharedLink);
          setScheduleSuccess("Interview scheduled. Shared link copied to clipboard.");
        } catch (e) {
          setScheduleSuccess("Interview scheduled. Shared link available in email.");
        }
      } else {
        setScheduleSuccess(response.data.isReschedule ? "Interview rescheduled successfully." : "Interview scheduled successfully.");
      }

      // Refresh interviews and all data to keep UI consistent
      await fetchInterviews(jobId);
      try { await axiosInstance.get('/company/applications/all').then(res => {
        const apps = res.data || [];
        const appsObj = {};
        const jobsObj = {};
        apps.forEach((app) => {
          const jId = app.jobId?._id || app.jobId;
          if (!appsObj[jId]) appsObj[jId] = [];
          appsObj[jId].push(app);
          if (app.jobId && !jobsObj[jId]) jobsObj[jId] = app.jobId;
        });
        setApplications(appsObj);
        setJobs(Object.values(jobsObj));
      }) } catch(e){ console.warn('Failed refreshing all data after schedule:', e); }

      setTimeout(() => closeScheduleModal(), 2000);
    } catch (err) {
      console.error("Interview scheduling error:", err);
      console.error("Error response:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || "An error occurred";
      setScheduleError(`Failed to ${isRescheduleMode ? "reschedule" : "schedule"} interview: ${errorMessage}`);
    } finally {
      setIsScheduling(false);
    }
  }, [interviewDate, selectedApplication, interviewNotes, isRescheduleMode, fetchInterviews, closeScheduleModal]);

  const downloadCSV = (jobId) => {
    let apps = [];
    if (jobId === "all") {
      apps = Object.values(applications).flat();
    } else {
      apps = applications[jobId];
    }
    if (!apps || apps.length === 0) return;
    
    // Comprehensive headers with all applicant details
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Title/Position",
      "Location",
      "Skills",
      "Cover Letter",
      "Resume Link",
      "Status",
      "Applied Date",
      "Job Title"
    ];
    
    // Build CSV rows with proper escaping for commas and quotes
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return "N/A";
      const strValue = String(str);
      // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
      if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    };
    
    const csvRows = [
      headers.join(","),
      ...apps.map((app) => {
        // Get resume URL (either from userProfile or application)
        const resumeUrl = app.userId?.resume || app.resume;
        const fullResumeUrl = resumeUrl 
          ? (resumeUrl.startsWith('http') ? resumeUrl : `${window.location.origin}${resumeUrl}`)
          : "N/A";
        
        // Get skills - check if it's an array of objects or strings
        let skills = "N/A";
        if (app.userId?.skills && Array.isArray(app.userId.skills)) {
          if (app.userId.skills.length > 0) {
            // Check if skills are objects with name property or just strings
            if (typeof app.userId.skills[0] === 'object' && app.userId.skills[0]?.name) {
              skills = app.userId.skills.map(s => s.name).join('; ');
            } else if (typeof app.userId.skills[0] === 'string') {
              skills = app.userId.skills.join('; ');
            }
          }
        }
        
        // Format applied date
        const appliedDate = app.createdAt 
          ? new Date(app.createdAt).toLocaleDateString()
          : "N/A";
        
        // Format phone number to prevent scientific notation - prepend with single quote
        const phoneNumber = app.userId?.phone 
          ? `'${app.userId.phone}` // Single quote forces Excel to treat as text
          : "N/A";
        
        return [
          escapeCSV(app.userId?.name || "N/A"),
          escapeCSV(app.userId?.email || "N/A"),
          phoneNumber, // Already has quote prefix, don't escape
          escapeCSV(app.userId?.title || "N/A"),
          escapeCSV(app.userId?.location || "N/A"),
          escapeCSV(skills),
          escapeCSV(app.coverLetter || "N/A"),
          escapeCSV(fullResumeUrl),
          escapeCSV(app.status || "Pending"),
          escapeCSV(appliedDate),
          escapeCSV(app.jobId?.jobTitle || "N/A")
        ].join(",");
      })
    ].join("\n");
    
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = jobId === "all" 
      ? `applications_all_${timestamp}.csv` 
      : `applications_${jobId}_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Remove debounce, use direct state for instant filtering

  const filteredAndSortedApplications = (appsList) => {
    let apps = [...appsList];
    if (activeTab !== "All") {
      if (activeTab === "Interviewed") {
        apps = apps.filter((app) => Object.values(interviews).flat().some((interview) => interview.applicationId?.toString() === app._id.toString()));
      } else {
        apps = apps.filter((app) => app.status?.toLowerCase() === activeTab.toLowerCase());
      }
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      apps = apps.filter((app) => {
        const jobTitle = app.jobId?.jobTitle?.toLowerCase() || "";
        const name = app.userId?.name?.toLowerCase() || "";
        const email = app.userId?.email?.toLowerCase() || "";
        return jobTitle.includes(search) || name.includes(search) || email.includes(search);
      });
    }
    if (sortConfig.key) {
      apps = [...apps].sort((a, b) => {
        let aValue = sortConfig.key === "userId" ? a.userId?.name || "" : a[sortConfig.key] || "";
        let bValue = sortConfig.key === "userId" ? b.userId?.name || "" : b[sortConfig.key] || "";
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return apps;
  };

  const handleSelectApplication = (jobId, appId) => {
    setSelectedApplications((prev) => {
      const jobSelections = prev[jobId] || [];
      return { ...prev, [jobId]: jobSelections.includes(appId) ? jobSelections.filter((id) => id !== appId) : [...jobSelections, appId] };
    });
  };

  const handleSelectAll = (jobId, apps) => {
    setSelectedApplications((prev) => {
      const allIds = apps.map((app) => app._id);
      return prev[jobId]?.length === allIds.length ? { ...prev, [jobId]: [] } : { ...prev, [jobId]: allIds };
    });
  };

  const handleBulkStatusUpdate = async (jobId, status) => {
    const selected = selectedApplications[jobId] || [];
    if (selected.length === 0) return;
    try {
      setStatusUpdating((prev) => ({ ...prev, [`bulk-${status}`]: true }));
      await Promise.all(selected.map((appId) => axiosInstance.put(`/company/applications/${appId}/status`, { status })));
      setStatusMessage(`Bulk updated ${selected.length} applications to ${status.charAt(0).toUpperCase() + status.slice(1)}.`);
      setStatusMessageType("success");
      const updatedApps = await axiosInstance.get(`/company/applications/${jobId}`);
      setApplications((prev) => ({ ...prev, [jobId]: updatedApps.data }));
      setSelectedApplications((prev) => ({ ...prev, [jobId]: [] }));
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage("Failed to bulk update statuses.");
      setStatusMessageType("error");
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [`bulk-${status}`]: false }));
    }
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const ApplicationTable = ({ apps, jobId = "all", isAll = false }) => {
    const filteredApps = filteredAndSortedApplications(apps);
    const displayedApps = filteredApps.slice(0, displayCount);
    
    // Infinite scroll handler
    const handleScroll = useCallback((e) => {
      const bottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 100;
      if (bottom && !isLoadingMore && displayCount < filteredApps.length) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setDisplayCount(prev => Math.min(prev + 50, filteredApps.length));
          setIsLoadingMore(false);
        }, 100);
      }
    }, [displayCount, filteredApps.length, isLoadingMore]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Filter and Action Bar */}
        <div className="mb-3 space-y-2 flex-shrink-0">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-1.5">
            {applicationTabs.map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {tab}
              </motion.button>
            ))}
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <div className="relative flex-1 max-w-xs">
              <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search by name, email..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <motion.button
                onClick={() => downloadCSV(jobId)}
                className="px-2.5 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800 flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow"
                disabled={filteredApps.length === 0}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaFileCsv className="text-xs" /> CSV
              </motion.button>
              <motion.button
                onClick={() => handleBulkStatusUpdate(jobId, "hired")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow ${
                  statusUpdating['bulk-hire'] ? "bg-gray-400 text-white cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
                }`}
                disabled={!(selectedApplications[jobId]?.length > 0) || statusUpdating['bulk-hire']}
                whileHover={{ scale: statusUpdating['bulk-hire'] ? 1 : 1.03 }}
                whileTap={{ scale: statusUpdating['bulk-hire'] ? 1 : 0.97 }}
              >
                {statusUpdating['bulk-hire'] ? <FaSpinner className="animate-spin text-xs" /> : <FaCalendarCheck className="text-xs" />}
                Hire
              </motion.button>
              <motion.button
                onClick={() => handleBulkStatusUpdate(jobId, "rejected")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow ${
                  statusUpdating['bulk-reject'] ? "bg-gray-400 text-white cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"
                }`}
                disabled={!(selectedApplications[jobId]?.length > 0) || statusUpdating['bulk-reject']}
                whileHover={{ scale: statusUpdating['bulk-reject'] ? 1 : 1.03 }}
                whileTap={{ scale: statusUpdating['bulk-reject'] ? 1 : 0.97 }}
              >
                {statusUpdating['bulk-reject'] ? <FaSpinner className="animate-spin text-xs" /> : <FaTimes className="text-xs" />}
                Reject
              </motion.button>
            </div>
          </div>
        </div>
        {loadingApplications ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FaSpinner className="text-4xl text-gray-900 animate-spin mb-3" />
            <span className="text-sm font-semibold text-gray-700">Loading applications...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <FaInfoCircle className="text-4xl mb-3 text-gray-400 mx-auto" />
            <p className="text-base font-bold text-gray-800 mb-1">No Applications Found</p>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <>
            <div 
              className="flex-1 overflow-auto rounded-lg border border-gray-200 shadow-lg bg-white"
              onScroll={handleScroll}
            >
              <table className="w-full bg-white text-xs">
                <thead className="bg-gray-900 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide" style={{width: '40px'}}>
                      <button onClick={() => handleSelectAll(jobId, filteredApps)} className="focus:outline-none">
                        {selectedApplications[jobId]?.length === filteredApps.length ? 
                          <FaCheckSquare className="text-white text-sm" /> : 
                          <FaSquare className="text-gray-400 text-sm" />
                        }
                      </button>
                    </th>
                    {isAll && <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '120px'}}>Job</th>}
                    <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '100px'}}>Name</th>
                    <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '140px'}}>Email</th>
                    <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '60px'}}>Cover</th>
                    <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '70px'}}>Resume</th>
                    <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '90px'}}>Interview</th>
                    <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '80px'}}>Status</th>
                    <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide whitespace-nowrap" style={{width: '120px'}}>Actions</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedApps.map((app) => {
                  // Extract actual job ID for interview lookup
                  const actualJobId = isAll 
                    ? (app.jobId?._id || app.jobId) 
                    : jobId;
                  
                  const interviewForApp = interviews[actualJobId]?.find(interview => {
                    const iUserId = interview.userId?._id ? interview.userId._id.toString() : interview.userId?.toString();
                    const aUserId = app.userId?._id ? app.userId._id.toString() : app.userId?.toString();
                    return iUserId === aUserId;
                  });

                  return (
                    <tr 
                      key={app._id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 py-2">
                        <button 
                          onClick={() => handleSelectApplication(jobId, app._id)} 
                          className="focus:outline-none"
                        >
                          {selectedApplications[jobId]?.includes(app._id) ? 
                            <FaCheckSquare className="text-gray-900 text-sm" /> : 
                            <FaSquare className="text-gray-300 text-sm" />
                          }
                        </button>
                      </td>
                      {isAll && (
                        <td className="px-2 py-2">
                          <div className="font-medium text-gray-900 truncate" style={{maxWidth: '120px'}} title={app.jobId?.jobTitle}>{app.jobId?.jobTitle || "N/A"}</div>
                        </td>
                      )}
                      <td className="px-2 py-2">
                        <div className="font-medium text-gray-900 truncate" style={{maxWidth: '100px'}} title={app.userId?.name}>{app.userId?.name || "N/A"}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-gray-600 truncate" style={{maxWidth: '140px'}} title={app.userId?.email}>{app.userId?.email || "N/A"}</div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {app.coverLetter ? (
                          <button
                            onClick={() => setCoverLetterModal({ open: true, text: app.coverLetter })}
                            className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {app.resume ? (
                          <a
                            href={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${app.resume}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100 transition-colors"
                          >
                            <FaFileAlt className="text-xs" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {loadingInterviews[actualJobId] ? (
                          <FaSpinner className="animate-spin text-gray-400 text-xs mx-auto" />
                        ) : interviewForApp ? (
                          <div className="space-y-0.5">
                            <div 
                              className={`text-xs font-medium px-2 py-0.5 rounded inline-block ${
                                interviewForApp.status === 'cancelled' 
                                  ? 'bg-red-100 text-red-700'
                                  : interviewForApp.status === 'completed'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                              title={`Status: ${interviewForApp.status || 'scheduled'}`}
                            >
                              {new Date(interviewForApp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {interviewForApp.status === 'cancelled' ? (
                              <button
                                onClick={() => openScheduleModal(app, actualJobId)}
                                className="block mx-auto px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-100 transition-colors"
                                title="Reschedule this interview"
                              >
                                Reschedule
                              </button>
                            ) : interviewForApp.status !== 'completed' && (
                              <button
                                onClick={() => handleCancelInterview(interviewForApp._id, actualJobId)}
                                className="block mx-auto px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                                title="Cancel this interview"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openScheduleModal(app, actualJobId)}
                            className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors"
                            title="Schedule an interview"
                          >
                            Schedule
                          </button>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold inline-block ${
                          app.status === 'hired' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          app.status === 'interviewed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => {
                              const userId = app.userId?._id || app.userId;
                              console.log("View Profile clicked - userId:", userId, "app.userId:", app.userId);
                              setViewProfileUserId(userId);
                            }}
                            className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            title="View Profile"
                          >
                            <FaUser className="text-xs" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const userId = app.userId?._id || app.userId;
                                console.log("Starting conversation with userId:", userId, "app.userId:", app.userId);
                                await startConversation("company", { userId });
                                navigate("/company/chat");
                              } catch (e) {
                                console.error("Error starting conversation:", e);
                              }
                            }}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Chat"
                          >
                            💬
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app._id, "hired", app.jobId)}
                            disabled={statusUpdating[app._id]}
                            className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-40"
                            title="Hire"
                          >
                            {statusUpdating[app._id] ? <FaSpinner className="animate-spin text-xs" /> : <FaCheck className="text-xs" />}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app._id, "rejected", app.jobId)}
                            disabled={statusUpdating[app._id]}
                            className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-40"
                            title="Reject"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {isLoadingMore && (
              <div className="text-center py-2 bg-gray-50 sticky bottom-0">
                <FaSpinner className="animate-spin text-gray-600 inline-block text-sm" />
                <span className="ml-1.5 text-xs text-gray-600">Loading more...</span>
              </div>
            )}
          </div>
          {displayCount < filteredApps.length && !isLoadingMore && (
            <div className="text-center py-2 text-xs text-gray-600 flex-shrink-0">
              Showing {displayCount} of {filteredApps.length} • Scroll down for more
            </div>
          )}
        </>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <CompanySidebar />
      <div className="flex-1 md:ml-80 overflow-hidden">
        <div className="h-screen flex flex-col p-3 md:p-4">
          {/* Page Header */}
          <div className="mb-3 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">Application Management</h1>
            <p className="text-xs text-gray-600">Manage and track all job applications in one place</p>
          </div>

          <AnimatePresence>
            {statusMessage && (
              <motion.div
                className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-2xl max-w-sm flex items-center gap-2 text-sm ${
                  statusMessageType === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              >
                {statusMessageType === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                <span className="flex-1 font-medium text-sm">{statusMessage}</span>
                <motion.button
                  onClick={() => setStatusMessage(null)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FaTimes className="text-sm" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Tabs */}
          <div className="flex gap-2 mb-3 flex-shrink-0">
            <motion.button
              className={`px-4 py-2 font-semibold rounded-lg text-xs transition-all duration-300 ${
                mainTab === "all" 
                  ? "bg-white text-gray-900 shadow-lg ring-2 ring-gray-900" 
                  : "bg-white/60 text-gray-600 hover:bg-white hover:shadow-md"
              }`}
              onClick={() => setMainTab("all")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              All Applications
            </motion.button>
            <motion.button
              className={`px-4 py-2 font-semibold rounded-lg text-xs transition-all duration-300 ${
                mainTab === "jobwise" 
                  ? "bg-white text-gray-900 shadow-lg ring-2 ring-gray-900" 
                  : "bg-white/60 text-gray-600 hover:bg-white hover:shadow-md"
              }`}
              onClick={() => setMainTab("jobwise")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              By Job Position
            </motion.button>
          </div>

          {/* Content Area - takes remaining space */}
          <div className="flex-1 overflow-hidden">
            {mainTab === "all" && (
              <motion.div 
                className="bg-white rounded-lg shadow-xl border border-gray-200 h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 flex-1 overflow-hidden flex flex-col">
                  <ApplicationTable apps={Object.values(applications).flat()} isAll={true} />
                </div>
              </motion.div>
            )}

            {mainTab === "jobwise" && (
              <motion.div 
                className="bg-white rounded-lg shadow-xl border border-gray-200 h-full flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 flex-1 overflow-auto">
                  <h2 className="text-base font-bold text-gray-900 mb-3">Select a Job Position</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                    {jobs.map((job) => (
                      <motion.button
                        key={job._id}
                        onClick={() => setSelectedJobTab(job._id)}
                        className={`p-3 rounded-lg font-medium text-left transition-all duration-200 text-xs ${
                          selectedJobTab === job._id 
                            ? "bg-gray-900 text-white shadow-lg ring-2 ring-gray-900" 
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="font-semibold truncate">{job.jobTitle}</div>
                        <div className={`text-xs ${selectedJobTab === job._id ? 'text-gray-300' : 'text-gray-500'}`}>
                          {applications[job._id]?.length || 0} applications
                      </div>
                    </motion.button>
                  ))}
                </div>
                {selectedJobTab && <ApplicationTable apps={applications[selectedJobTab] || []} jobId={selectedJobTab} />}
              </div>
            </motion.div>
          )}
        </div>

          {/* Modals */}
          {viewProfileUserId && (
            <CompanyViewProfileModal userId={viewProfileUserId} onClose={() => setViewProfileUserId(null)} />
          )}
          
          <Modal
            isOpen={isScheduleModalOpen}
            onRequestClose={closeScheduleModal}
            className="bg-white rounded-xl p-6 max-w-md mx-auto shadow-2xl border border-gray-200 z-50"
            overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-50"
          >
            <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
              <FaCalendar className="text-indigo-600" />
              {isRescheduleMode ? "Reschedule Interview" : "Schedule Interview"}
            </h2>
            {scheduleError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <FaExclamationCircle className="text-base mt-0.5 flex-shrink-0" />
                <span>{scheduleError}</span>
              </div>
            )}
            {scheduleSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
                <FaCheckCircle className="text-base mt-0.5 flex-shrink-0" />
                <span>{scheduleSuccess}</span>
              </div>
            )}
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  selected={interviewDate}
                  onChange={(date) => setInterviewDate(date)}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  minTime={interviewDate?.toDateString() === new Date().toDateString() ? new Date() : new Date(new Date().setHours(0, 0, 0, 0))}
                  maxTime={new Date(new Date().setHours(23, 59, 59, 999))}
                  filterTime={(time) => {
                    const selectedDate = new Date(time);
                    const now = new Date();
                    return selectedDate.getTime() > now.getTime();
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholderText="Select future date and time"
                />
                <p className="text-xs text-gray-500 mt-1">
                  <FaClock className="inline mr-1" />
                  Only future dates and times can be selected
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Add any special instructions, meeting link, or notes for the candidate..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {interviewNotes.length}/500 characters
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <motion.button
                onClick={closeScheduleModal}
                disabled={isScheduling}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleScheduleInterview}
                disabled={isScheduling}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isScheduling ? 1 : 1.03 }}
                whileTap={{ scale: isScheduling ? 1 : 0.97 }}
              >
                {isScheduling ? <FaSpinner className="animate-spin" /> : <FaCalendar />}
                {isScheduling ? "Scheduling..." : isRescheduleMode ? "Reschedule Interview" : "Schedule Interview"}
              </motion.button>
            </div>
          </Modal>

          <Modal
            isOpen={coverLetterModal.open}
            onRequestClose={() => setCoverLetterModal({ open: false, text: "" })}
            className="bg-white rounded-xl p-6 max-w-2xl mx-auto shadow-2xl border border-gray-200 relative z-[100]"
            overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-[100]"
          >
            <h2 className="text-lg font-bold mb-4 text-gray-900">Cover Letter</h2>
            <div className="mb-5 bg-gray-50 p-5 rounded-lg max-h-96 overflow-y-auto border border-gray-200">
              <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{coverLetterModal.text}</p>
            </div>
            <div className="flex justify-end">
              <motion.button
                onClick={() => setCoverLetterModal({ open: false, text: "" })}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Close
              </motion.button>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default CompanyApplicationsDashboard;