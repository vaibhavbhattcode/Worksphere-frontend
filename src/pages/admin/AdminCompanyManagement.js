import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/AdminLayout";
import axios from "../../api/api";
import CompanyAnalyticsCharts from "../../components/admin/CompanyAnalyticsCharts";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import { motion } from "framer-motion";
import EnhancedSkeleton from "../../components/admin/EnhancedSkeleton";
import { useDebounce, useSelection } from "../../hooks/usePerformanceOptimizations";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

const AdminCompanyManagement = () => {
  const navigate = useNavigate();

  // basic list state
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // search / filtering / sorting
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState([]);
  const [sortOrder, setSortOrder] = useState([]);

  // Infinite scroll states
  const [displayCount, setDisplayCount] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  // selection helper (uses companies list)
  const selection = useSelection(companies);

  // totals / stats
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [realTotals, setRealTotals] = useState({ activeCompanies: 0, inactiveCompanies: 0 });

  // modal / analytics state
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [togglingCompanyId, setTogglingCompanyId] = useState(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'info'
  });

  useEffect(() => {
    fetchCompanies();
  }, [debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

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

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken || adminToken === "null" || adminToken === "undefined") {
      toast.error("Please log in as an admin.");
      navigate("/admin/login");
      return;
    }

    try {
      const response = await axios.get("/admin/companies", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        params: {
          limit: 0,
          search: debouncedSearchTerm,
          status: statusFilter ? statusFilter.value : undefined,
          sortBy: sortBy.join(","),
          sortOrder: sortOrder.join(","),
        },
      });
      setCompanies(Array.isArray(response.data.companies) ? response.data.companies : []);
      setTotalCompanies(response.data["realTotals"]?.totalCompanies || response.data.total || 0);

      // Store real totals for statistics display
      if (response.data["realTotals"]) {
        setRealTotals(response.data["realTotals"]);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
        toast.error("Session expired or invalid. Please log in again as an admin.");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      } else {
        toast.error("Failed to fetch companies.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Company',
      message: 'Are you sure you want to delete this company? All related data (jobs, applications, conversations) will be permanently removed. The company will be notified by email.',
      type: 'danger',
      onConfirm: async () => {
        const adminToken = localStorage.getItem("adminToken");
        if (!adminToken || adminToken === "null" || adminToken === "undefined") {
          toast.error("Please log in as an admin.");
          navigate("/admin/login");
          return;
        }

        try {
          await axios.delete(`/admin/companies/${id}`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          toast.success("Company deleted successfully! Email notification sent to company.");
          selection.clearSelection();
          fetchCompanies();
        } catch (error) {
          console.error("Error deleting company:", error);
          if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
            toast.error("Session expired. Please log in again as an admin.");
            localStorage.removeItem("adminToken");
            navigate("/admin/login");
          } else if (error.response?.status === 404) {
            toast.error("Company not found. It may have been already deleted.");
            fetchCompanies();
          } else {
            toast.error("Failed to delete company. Please try again.");
          }
        }
      }
    });
  };

  const handleToggleStatus = async (company) => {
    setConfirmDialog({
      isOpen: true,
      title: company.isActive ? 'Deactivate Company' : 'Activate Company',
      message: `Are you sure you want to ${company.isActive ? 'deactivate' : 'activate'} ${company.companyName}? ${company.isActive ? 'The company will not be able to post jobs or manage applications.' : 'The company will regain full access to the platform.'} A notification email will be sent.`,
      type: company.isActive ? 'warning' : 'info',
      onConfirm: async () => {
        const adminToken = localStorage.getItem("adminToken");
        if (!adminToken || adminToken === "null" || adminToken === "undefined") {
          toast.error("Please log in as an admin.");
          navigate("/admin/login");
          return;
        }

        setTogglingCompanyId(company._id);
        try {
          const response = await axios.patch(
            `/admin/companies/${company._id}/toggle-active`,
            {},
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            }
          );
          const { isActive } = response.data;
          toast.success(
            `Company ${isActive ? "activated" : "deactivated"} successfully! Email notification sent to company.`
          );
          setCompanies(
            companies.map((c) =>
              c._id === company._id ? { ...c, isActive: isActive } : c
            )
          );
        } catch (error) {
          console.error("Error updating company status:", error);
          if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
            toast.error("Session expired. Please log in again as an admin.");
            localStorage.removeItem("adminToken");
            navigate("/admin/login");
          } else if (error.response?.status === 404) {
            toast.error("Company not found.");
            fetchCompanies();
          } else {
            toast.error("Failed to update company status. Please try again.");
          }
        } finally {
          setTogglingCompanyId(null);
        }
      }
    });
  };

  const handleBulkToggleActive = async (isActive) => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken || adminToken === "null" || adminToken === "undefined") {
      toast.error("Please log in as an admin.");
      navigate("/admin/login");
      return;
    }

    if (selection.selectedCount === 0) {
      toast.warning("No companies selected");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: isActive ? 'Activate Companies' : 'Deactivate Companies',
      message: `Are you sure you want to ${isActive ? 'activate' : 'deactivate'} ${selection.selectedCount} selected ${selection.selectedCount === 1 ? 'company' : 'companies'}? ${isActive ? 'These companies will regain full access to the platform.' : 'These companies will not be able to post jobs or manage applications.'} Email notifications will be sent to all affected companies.`,
      type: isActive ? 'info' : 'warning',
      onConfirm: async () => {
        try {
          toast.info(`Processing ${selection.selectedCount} company(ies)...`);
          await axios.patch(
            "/admin/companies/bulk-toggle-active",
            { ids: selection.selectedIds, isActive },
            {
              headers: {
                Authorization: `Bearer ${adminToken}`,
              },
            }
          );
          toast.success(
            `${selection.selectedCount} companies ${isActive ? "activated" : "deactivated"} successfully! Email notifications sent.`
          );
          selection.clearSelection();
          fetchCompanies();
        } catch (error) {
          console.error("Error bulk toggling companies:", error);
          if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
            toast.error("Session expired. Please log in again as an admin.");
            localStorage.removeItem("adminToken");
            navigate("/admin/login");
          } else {
            toast.error(`Failed to ${isActive ? "activate" : "deactivate"} companies. Please try again.`);
          }
        }
      }
    });
  };

  const fetchCompanyAnalytics = async (companyId) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken || adminToken === "null" || adminToken === "undefined") {
      toast.error("Please log in as an admin.");
      navigate("/admin/login");
      return;
    }

    try {
      const response = await axios.get(`/admin/companies/${companyId}/details`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      setSelectedCompany(response.data);
      setShowAnalyticsModal(true);
    } catch (error) {
      console.error("Error fetching company analytics:", error);
      if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
        toast.error("Session expired. Please log in again as an admin.");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      } else {
        toast.error("Failed to fetch company analytics.");
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const [modalOpen, setModalOpen] = useState(false);

  // Cleanup effect to restore body scroll if component unmounts
  useEffect(() => {
    return () => {
      if (modalOpen) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [modalOpen]);

  // Prevent page-level horizontal scroll while this admin page is mounted.
  // Keep inner containers (tables) scrollable via their own overflow rules.
  useEffect(() => {
    const prev = document.documentElement.style.overflowX;
    document.documentElement.style.overflowX = 'hidden';
    return () => {
      document.documentElement.style.overflowX = prev || '';
    };
  }, []);

  // Handle modal state and body scroll lock
  const handleOpenModal = (companyId) => {
    setModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent body scroll
    fetchCompanyAnalytics(companyId);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setShowAnalyticsModal(false);
    setSelectedCompany(null);
    setAnalyticsError(null);
    document.body.style.overflow = 'unset'; // Restore body scroll
  };

  // Update closeModal to use the new handler
  const closeModal = handleCloseModal;

  // Calculate filtered companies for display
  const filteredCompanies = React.useMemo(() => {
    let filtered = companies;

    // Apply status filter if selected
    if (statusFilter && statusFilter.value) {
      if (statusFilter.value === 'active') {
        filtered = filtered.filter(company => company.isActive);
      } else if (statusFilter.value === 'inactive') {
        filtered = filtered.filter(company => !company.isActive);
      }
    }

    // Apply search filter if provided (client-side for better UX)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        (company.companyName && company.companyName.toLowerCase().includes(searchLower)) ||
        (company.email && company.email.toLowerCase().includes(searchLower)) ||
        (company.companyProfile?.industry && company.companyProfile.industry.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [companies, statusFilter, debouncedSearchTerm]);

  // Infinite scroll display logic
  const displayedCompanies = filteredCompanies.slice(0, displayCount);
  
  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [debouncedSearchTerm, statusFilter, sortBy, sortOrder]);
  
  // Update hasMore flag
  useEffect(() => {
    setHasMore(displayCount < filteredCompanies.length);
  }, [displayCount, filteredCompanies.length]);
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setDisplayCount(prev => Math.min(prev + 20, filteredCompanies.length));
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
  }, [hasMore, loading, filteredCompanies.length]);

  const statusOptions = [
    { value: null, label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeModal();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Modal Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedCompany?.companyProfile?.logo ? (
                <img
                  src={selectedCompany.companyProfile.logo}
                  alt={selectedCompany?.companyProfile?.companyName || "Company"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/uploads/defaults/companyprofile.png';
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-indigo-200 shadow-sm">
                  {selectedCompany?.companyProfile?.companyName?.charAt(0)?.toUpperCase() || "C"}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCompany?.companyProfile?.companyName || "Company Name"}</h2>
                <p className="text-gray-600">{selectedCompany?.email}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={closeModal}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-sm"
              aria-label="Close analytics modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Premium Modal Body */}
  <div className="flex-1 overflow-y-auto p-8 pb-24 bg-gray-50">
          <div className="grid grid-cols-1 gap-8">
            {/* Left Column - Company Profile Summary */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  Company Profile Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                  >
                    <p className="text-xs font-medium text-gray-600 mb-2">Company Name</p>
                    <p className="text-sm font-bold text-gray-900 break-words">{selectedCompany?.companyProfile?.companyName || "N/A"}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                  >
                    <p className="text-xs font-medium text-gray-600 mb-2">Industry</p>
                    <p className="text-sm font-bold text-gray-900 break-words">{selectedCompany?.companyProfile?.industry || "N/A"}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                  >
                    <p className="text-xs font-medium text-gray-600 mb-2">Company Size</p>
                    <p className="text-sm font-bold text-gray-900 break-words">{selectedCompany?.companyProfile?.companySize || "N/A"}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                  >
                    <p className="text-xs font-medium text-gray-600 mb-2">Founded</p>
                    <p className="text-sm font-bold text-gray-900 break-words">{selectedCompany?.companyProfile?.founded || "N/A"}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                  >
                    <p className="text-xs font-medium text-gray-600 mb-2">Phone</p>
                    <p className="text-sm font-bold text-gray-900 break-words">{selectedCompany?.companyProfile?.phone || "N/A"}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                  >
                    <p className="text-xs font-medium text-gray-600 mb-2">Website</p>
                    {selectedCompany?.companyProfile?.website ? (
                      <a
                        href={selectedCompany?.companyProfile?.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900 font-semibold transition-colors text-sm break-all hover:underline"
                      >
                        Visit Website
                      </a>
                    ) : (
                      <p className="text-gray-500 text-sm">N/A</p>
                    )}
                  </motion.div>
                </div>

                {selectedCompany?.companyProfile?.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-5 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-[40vh] overflow-y-auto"
                  >
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Company Description</h4>
                    <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-line">{selectedCompany?.companyProfile?.description}</p>
                  </motion.div>
                )}
              </motion.div>

              {/* Hiring Summary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Hiring Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Posted Jobs</p>
                    <p className="text-xl font-bold text-gray-900">{selectedCompany?.jobs?.length || 0}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center"
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Active Jobs</p>
                    <p className="text-xl font-bold text-gray-900">{selectedCompany?.hiringData?.activeJobsCount || 0}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center"
                  >
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Total Interviews</p>
                    <p className="text-xl font-bold text-gray-900">{selectedCompany?.hiringData?.totalInterviews || 0}</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Analytics & Insights (full-width, below profile) */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Analytics & Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Job Postings Over Time</p>
                    <div className="h-56 w-full">
                      <CompanyAnalyticsCharts
                        jobs={selectedCompany?.jobs || []}
                        interviews={selectedCompany?.interviews || []}
                        hiringData={selectedCompany?.hiringData || {}}
                        type="jobs"
                        height={280}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Interviews Over Time</p>
                    <div className="h-56 w-full">
                      <CompanyAnalyticsCharts
                        jobs={[]}
                        interviews={selectedCompany?.interviews || []}
                        hiringData={{}}
                        type="interviews"
                        height={280}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Hiring Summary</p>
                    <div className="h-56 w-full">
                      <CompanyAnalyticsCharts
                        jobs={[]}
                        interviews={[]}
                        hiringData={selectedCompany?.hiringData || {}}
                        type="hiring"
                        height={280}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Premium Modal Footer */}
        <div className="bg-white border-t border-gray-200 p-6 flex justify-end sticky bottom-0 z-40">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={closeModal}
            className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
          >
            Close Analytics
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <AdminLayout>
      {/* Confirmation Dialog Portal */}
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
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ) : confirmDialog.type === 'warning' ? (
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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

      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen overflow-x-hidden"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Toaster position="top-right" reverseOrder={false} />

          {/* Premium Header Section */}
          <div className="mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 lg:p-6"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-2xl"></div>

              <div className="relative">
             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                      Company Management
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-1">
                 Manage and monitor all registered companies with advanced controls.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        {totalCompanies.toLocaleString()} Total Companies
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {realTotals.activeCompanies.toLocaleString()} Active Companies
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        {realTotals.inactiveCompanies.toLocaleString()} Inactive Companies
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 px-4 py-3 rounded-xl shadow-lg border border-emerald-100 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Advanced Controls
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-3 rounded-xl shadow-lg border border-indigo-100 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Real-time Analytics
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Premium Search & Filter Section (aligned with User Management) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 lg:p-7 relative">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-transparent to-blue-50/20 rounded-2xl"></div>

              <div className="relative">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search companies by name, email, or industry..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 border-0 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                        aria-label="Search companies"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-full sm:w-48">
                      <Select
                        options={statusOptions}
                        value={statusOptions.find((opt) => opt.value === (statusFilter ? statusFilter.value : null))}
                        onChange={(option) => setStatusFilter(option)}
                        classNamePrefix="react-select"
                        placeholder="Filter by Status"
                        isClearable
                        aria-label="Filter by status"
                        menuPlacement="auto"
                        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({
                            ...base,
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.75rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                          }),
                        }}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter(null);
                      }}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                      title="Clear Filters"
                      aria-label="Clear filters"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Premium Bulk Actions Section */}
          {selection.hasSelection && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-0 z-20 mb-6 sm:mb-8"
            >
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-lg">
                        {selection.selectedCount} Companies Selected
                      </span>
                      <p className="text-gray-600 text-sm">
                        Choose an action to apply to all selected companies
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBulkToggleActive(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                      title="Activate selected companies"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Activate All
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBulkToggleActive(false)}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                      title="Deactivate selected companies"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Deactivate All
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Companies Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selection.isAllSelected}
                        onChange={(e) => {
                          if (e.target.checked) selection.selectAll();
                          else selection.clearSelection();
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                        aria-label="Select all companies"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6">
                        <EnhancedSkeleton count={20} height="h-12" />
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : displayedCompanies.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center py-16 w-full"
                        >
                          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-8 rounded-3xl shadow-lg border border-indigo-200">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">No Companies Found</h3>
                              <p className="text-gray-600 mb-4">
                                {searchTerm || statusFilter ?
                                  "No companies match your current search criteria." :
                                  "No companies have been registered on the platform yet."
                                }
                              </p>
                              {(searchTerm || statusFilter) && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSearchTerm("");
                                    setStatusFilter(null);
                                  }}
                                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                                >
                                  Clear Filters
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  ) : (
                    displayedCompanies.map((company, idx) => (
                      <motion.tr
                        key={company._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`hover:bg-gray-50 transition-colors ${company.isActive ? 'bg-white' : 'bg-red-50/50'}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selection.isSelected(company._id)}
                            onChange={() => selection.toggleSelection(company._id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                            aria-label={`Select company ${company.companyName || company.email}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {company.companyProfile?.logo ? (
                              <img
                                src={company.companyProfile.logo}
                                alt={company.companyName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/uploads/defaults/companyprofile.png';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm border-2 border-indigo-200">
                                {company.companyName?.charAt(0)?.toUpperCase() || "C"}
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{company.companyName || "Unnamed Company"}</div>
                              <div className="text-sm text-gray-500">
                                Joined {new Date(company.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 break-words">{company.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 break-words">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {company.companyProfile?.industry || "Not Specified"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${company.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {company.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleOpenModal(company._id)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Analytics
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleToggleStatus(company)}
                              disabled={togglingCompanyId === company._id}
                              className={`flex items-center gap-2 text-xs font-medium rounded-md px-2 py-1 transition-all duration-200 ${company.isActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                            >
                              {togglingCompanyId === company._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              ) : company.isActive ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              <span>{company.isActive ? 'Deactivate' : 'Activate'}</span>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05, y: -1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(company._id)}
                              className="flex items-center gap-2 px-2 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Delete
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Infinite Scroll Loader */}
            {hasMore && !loading && (
              <div ref={loadMoreRef} className="px-6 py-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </motion.div>
                <p className="mt-2 text-sm text-gray-600">Loading more companies...</p>
              </div>
            )}

            {/* Showing count */}
            {!loading && displayedCompanies.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
                <span className="text-sm font-medium text-gray-700">
                  Showing <span className="text-indigo-600 font-semibold">{displayedCompanies.length}</span> of{" "}
                  <span className="text-indigo-600 font-semibold">{filteredCompanies.length}</span> companies
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      {showAnalyticsModal && selectedCompany && createPortal(modalContent, document.body)}
    </AdminLayout>
  );
};

export default AdminCompanyManagement;