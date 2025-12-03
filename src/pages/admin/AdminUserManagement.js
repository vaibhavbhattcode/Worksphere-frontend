// Utility to format date as DD/MM/YYYY
function formatDateDMY(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date)) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/AdminLayout";
import axios from "../../api/api";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { motion } from "framer-motion";
import EnhancedSkeleton from "../../components/admin/EnhancedSkeleton";
import { useDebounce, useSelection } from "../../hooks/usePerformanceOptimizations";
import { createPortal } from "react-dom";

const AdminUserManagement = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortBy, setSortBy] = useState(["createdAt"]);
  const [sortOrder, setSortOrder] = useState(["desc"]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [realTotals, setRealTotals] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0 });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'info'
  });

  const navigate = useNavigate();

  // Performance optimizations
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const selection = useSelection(users);
  
  // Infinite scroll states
  const [displayCount, setDisplayCount] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

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

  const fetchUsers = async () => {
    setIsLoading(true);
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken || adminToken === "null" || adminToken === "undefined") {
      toast.error("Please log in as an admin.");
      navigate("/admin/login");
      return;
    }

    try {
      const params = {
        search: debouncedSearchTerm,
        status: statusFilter ? statusFilter.value : undefined,
        sortBy: sortBy.join(","),
        sortOrder: sortOrder.join(","),
        limit: 0,
      };

      const response = await axios.get("/admin/users", {
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true,
        params,
      });

      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
      setTotalUsers(response.data["realTotals"]?.totalUsers || response.data.total || 0);

      // Store real totals for statistics display
      if (response.data["realTotals"]) {
        setRealTotals(response.data["realTotals"]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
        toast.error("Session expired or invalid. Please log in again as an admin.");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      } else {
        toast.error("Failed to fetch users.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

  const handleBulkToggleActive = async (isActive) => {
    if (selection.selectedCount === 0) {
      toast.warning("No users selected");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: isActive ? 'Activate Users' : 'Deactivate Users',
      message: `Are you sure you want to ${isActive ? 'activate' : 'deactivate'} ${selection.selectedCount} selected ${selection.selectedCount === 1 ? 'user' : 'users'}? ${isActive ? 'These users will regain full access to the platform.' : 'These users will not be able to access the platform.'} Email notifications will be sent to all affected users.`,
      type: isActive ? 'info' : 'warning',
      onConfirm: async () => {
        const adminToken = localStorage.getItem("adminToken");
        if (!adminToken || adminToken === "null" || adminToken === "undefined") {
          toast.error("Please log in as an admin.");
          navigate("/admin/login");
          return;
        }

        try {
          toast.info(`Processing ${selection.selectedCount} user(s)...`);
          await axios.patch(
            "/admin/users/bulk-toggle-active",
            { ids: selection.selectedIds, isActive },
            {
              headers: { Authorization: `Bearer ${adminToken}` },
              withCredentials: true,
            }
          );
          toast.success(
            `${selection.selectedCount} users ${isActive ? "activated" : "deactivated"} successfully! Email notifications sent.`
          );
          selection.clearSelection();
          fetchUsers();
        } catch (error) {
          console.error("Error updating users:", error);
          if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
            toast.error("Session expired. Please log in again as an admin.");
            localStorage.removeItem("adminToken");
            navigate("/admin/login");
          } else {
            toast.error("Failed to update selected users.");
          }
        }
      }
    });
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? All related data (applications, saved jobs, messages) will be permanently removed. The user will be notified by email.',
      type: 'danger',
      onConfirm: async () => {
        const adminToken = localStorage.getItem("adminToken");
        if (!adminToken || adminToken === "null" || adminToken === "undefined") {
          toast.error("Please log in as an admin.");
          navigate("/admin/login");
          return;
        }

        try {
          await axios.delete("/admin/users/" + id, {
            headers: { Authorization: `Bearer ${adminToken}` },
            withCredentials: true,
          });
          toast.success("User deleted successfully! Notification email sent to user.");
          selection.clearSelection();
          fetchUsers();
        } catch (error) {
          console.error("Error deleting user:", error);
          if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
            toast.error("Session expired. Please log in again as an admin.");
            localStorage.removeItem("adminToken");
            navigate("/admin/login");
          } else if (error.response?.status === 404) {
            toast.error("User not found. It may have been already deleted.");
            fetchUsers();
          } else {
            toast.error("Failed to delete user.");
          }
        }
      }
    });
  };

  const handleToggleActive = async (id, currentStatus) => {
    const user = users.find(u => u._id === id);
    const userName = user?.profile?.name || user?.email?.split('@')[0] || 'User';
    
    setConfirmDialog({
      isOpen: true,
      title: currentStatus ? 'Deactivate User' : 'Activate User',
      message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} ${userName}? ${currentStatus ? 'The user will not be able to access the platform.' : 'The user will regain full access to the platform.'} A notification email will be sent.`,
      type: currentStatus ? 'warning' : 'info',
      onConfirm: async () => {
        setTogglingUserId(id);
        const adminToken = localStorage.getItem("adminToken");

        if (!adminToken || adminToken === "null" || adminToken === "undefined") {
          toast.error("Please log in as an admin.");
          navigate("/admin/login");
          setTogglingUserId(null);
          return;
        }

        try {
          const response = await axios.patch(
            "/admin/users/" + id + "/toggle-active",
            {},
            {
              headers: { Authorization: `Bearer ${adminToken}` },
              withCredentials: true,
            }
          );
          const { isActive } = response.data;
          toast.success(
            `User ${isActive ? "activated" : "deactivated"} successfully! Email notification sent to user.`
          );
          fetchUsers();
        } catch (error) {
          console.error("Error toggling user status:", error);
          if (error.response?.status === 404) {
            toast.error("User not found. It may have been deleted.");
            fetchUsers();
          } else if (error.response?.status === 401 || error.message?.includes("jwt malformed")) {
            toast.error("Session expired. Please log in again as an admin.");
            localStorage.removeItem("adminToken");
            navigate("/admin/login");
          } else {
            toast.error("Failed to toggle user status.");
          }
        } finally {
          setTogglingUserId(null);
        }
      }
    });
  };

  const openProfileModal = (profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const closeProfileModal = () => {
    setSelectedProfile(null);
    setIsModalOpen(false);
  };

  const renderProfileField = (label, value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    if (Array.isArray(value)) {
      if (
        value.length > 0 &&
        typeof value[0] === "object" &&
        value[0] !== null
      ) {
        if (label === "Education") {
          return (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
              <ul className="list-disc list-inside ml-4 text-gray-600">
                {value.map((item, index) => (
                  <li key={item._id || index}>
                    <div>
                      <strong>{item.degree}</strong> from{" "}
                      <em>{item.institution}</em> ({item.year})
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        } else if (label === "Experience") {
          return (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
              <ul className="list-disc list-inside ml-4 text-gray-600">
                {value.map((item, index) => (
                  <li key={item._id || index}>
                    <div>
                      <strong>{item.position}</strong> at{" "}
                      <em>{item.company}</em> ({item.start} -{" "}
                      {item.end || "Present"})
                    </div>
                    {item.description && <div>{item.description}</div>}
                  </li>
                ))}
              </ul>
            </div>
          );
        } else if (label === "Skills") {
          return (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {value.map((item, index) => (
                  <span
                    key={item._id || index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          );
        }
      }
      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
          <ul className="list-disc list-inside ml-4 text-gray-600">
            {value.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      return (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
          <ul className="list-disc list-inside ml-4 text-gray-600">
            {Object.entries(value).map(([key, val]) => {
              if (!val) return null;
              return (
                <li key={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}: {val}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        <p className="text-gray-600">{value}</p>
      </div>
    );
  };

  const statusOptions = [
    { value: null, label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "deactivated", label: "Deactivated" },
  ];

  // Calculate filtered users for display (client-side for better UX)
  const filteredUsers = React.useMemo(() => {
    let filtered = users;

    // Apply status filter if selected
    if (statusFilter && statusFilter.value) {
      if (statusFilter.value === 'active') {
        filtered = filtered.filter(user => user.isActive);
      } else if (statusFilter.value === 'deactivated') {
        filtered = filtered.filter(user => !user.isActive);
      }
    }

    // Apply search filter if provided
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.profile?.name && user.profile.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.role && user.role.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [users, statusFilter, debouncedSearchTerm]);

  // Infinite scroll display logic
  const displayedUsers = filteredUsers.slice(0, displayCount);
  
  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [debouncedSearchTerm, statusFilter, sortBy, sortOrder]);
  
  // Update hasMore flag
  useEffect(() => {
    setHasMore(displayCount < filteredUsers.length);
  }, [displayCount, filteredUsers.length]);
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setDisplayCount(prev => Math.min(prev + 20, filteredUsers.length));
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
  }, [hasMore, isLoading, filteredUsers.length]);

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
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Premium Header Section */}
          <div className="mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 lg:p-7"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-2xl"></div>

              <div className="relative">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                      User Management
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-1">
                      Manage and monitor all platform users with advanced controls
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        {totalUsers.toLocaleString()} Total Users
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {(totalUsers && users.length > 0) ?
                          Math.floor((users.filter(u => u.isActive).length / users.length) * totalUsers) :
                          0} Active Users
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        {(totalUsers && users.length > 0) ?
                          Math.floor((users.filter(u => !u.isActive).length / users.length) * totalUsers) :
                          0} Inactive Users
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 px-4 py-3 rounded-xl shadow-lg border border-emerald-100 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">System Status</p>
                          <p className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            All Systems Operational
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Premium Search & Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 lg:p-7">
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
                        placeholder="Search users by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 border-0 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                        aria-label="Search users"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-full sm:w-48">
                      <Select
                        options={statusOptions}
                        value={statusOptions.find(
                          (opt) =>
                            opt.value === (statusFilter ? statusFilter.value : null)
                        )}
                        onChange={(option) => setStatusFilter(option)}
                        classNamePrefix="react-select"
                        placeholder="Filter by Status"
                        isClearable
                        aria-label="Filter by status"
                        menuPlacement="auto"
                        menuPortalTarget={
                          typeof window !== "undefined" ? document.body : null
                        }
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
                        {selection.selectedCount} Users Selected
                      </span>
                      <p className="text-gray-600 text-sm">
                        Choose an action to apply to all selected users
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBulkToggleActive(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                      title="Activate selected users"
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
                      title="Deactivate selected users"
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

          {/* Premium Loading State */}
          {isLoading ? (
            <EnhancedSkeleton type="table" rows={20} />
          ) : filteredUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-8 rounded-3xl shadow-lg border border-indigo-200">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter ?
                      "No users match your current search criteria." :
                      "No users have been registered on the platform yet."
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
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={
                            filteredUsers.length > 0 &&
                            selection.isAllSelected
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              selection.selectAll();
                            } else {
                              selection.clearSelection();
                            }
                          }}
                          className="w-4 h-4 text-gray-600 bg-white border-gray-300 rounded focus:ring-gray-500"
                          aria-label="Select all users"
                        />
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedUsers.map((user, idx) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`hover:bg-gray-50 transition-colors duration-200 ${
                          user.isActive ? "bg-white" : "bg-red-50/50"
                        }`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selection.isSelected(user._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                selection.toggleSelection(user._id);
                              } else {
                                selection.toggleSelection(user._id);
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500"
                            aria-label={`Select user ${
                              user.profile?.name || user.email
                            }`}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center shadow-sm overflow-hidden">
                              {user.profile?.profileImage ? (
                                <img
                                  src={user.profile.profileImage}
                                  alt={`${user.profile?.name || user.email.split("@")[0]}'s avatar`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${user.profile?.profileImage ? 'hidden' : ''}`}>
                                <span className="text-sm font-semibold text-gray-600">
                                  {(user.profile?.name || user.email.split("@")[0]).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">
                                {user.profile?.name || user.email.split("@")[0]}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDateDMY(user.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-sm text-gray-900 truncate max-w-[200px]" title={user.email}>{user.email}</div>
                          {user.profile?.phone && (
                            <div className="text-xs text-gray-500 truncate">{user.profile.phone}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.isAdmin
                                ? "bg-gray-100 text-gray-800 border border-gray-200"
                                : user.role === "employer"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-green-50 text-green-800 border border-green-200"
                            }`}>
                              {user.isAdmin ? "Admin" : user.role || "User"}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.isActive
                                ? "bg-green-50 text-green-800 border border-green-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                handleToggleActive(user._id, user.isActive)
                              }
                              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-medium shadow-sm transition-all duration-200 whitespace-nowrap ${
                                user.isActive
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                              disabled={togglingUserId === user._id}
                            >
                              {togglingUserId === user._id ? (
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                              ) : user.isActive ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              <span>{user.isActive ? "Deactivate" : "Activate"}</span>
                            </motion.button>

                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => openProfileModal(user.profile)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-sm transition-all duration-200 text-xs font-medium"
                                disabled={!user.profile}
                                title="View Profile"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>View</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleDelete(user._id)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg shadow-sm transition-all duration-200 text-xs font-medium"
                                title="Delete User"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </motion.button>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Infinite Scroll Loader */}
              {hasMore && !isLoading && (
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
                  <p className="mt-2 text-sm text-gray-600">Loading more users...</p>
                </div>
              )}

              {/* Showing count */}
              {!isLoading && displayedUsers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
                  <span className="text-sm font-medium text-gray-700">
                    Showing <span className="text-indigo-600 font-semibold">{displayedUsers.length}</span> of{" "}
                    <span className="text-indigo-600 font-semibold">{filteredUsers.length}</span> users
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Profile Modal */}
      {isModalOpen && selectedProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeProfileModal}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeProfileModal();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium Modal Header */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 p-8 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                    {selectedProfile.profileImage ? (
                      <img
                        src={selectedProfile.profileImage}
                        alt={`${selectedProfile.name || "User"}'s profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to letter if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${selectedProfile.profileImage ? 'hidden' : ''}`}> 
                      <span className="text-2xl font-bold text-gray-700">
                        {(selectedProfile.name || "User").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedProfile.name || "User Profile"}
                    </h2>
                    <p className="text-gray-600 text-lg">
                      Complete profile information and details
                    </p>
                  </div>
                </div>
                {/* Always visible close button, sticky in modal */}
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeProfileModal}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-sm fixed top-8 right-8 z-50 md:static md:top-auto md:right-auto"
                  aria-label="Close profile modal"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Premium Modal Content */}
            <div className="p-8 max-h-96 overflow-y-auto bg-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      {renderProfileField("Title", selectedProfile.title)}
                      {renderProfileField("Location", selectedProfile.location)}
                      {renderProfileField("Phone", selectedProfile.phone)}
                      {renderProfileField("About", selectedProfile.about)}
                    </div>
                  </motion.div>

                  {/* Skills Section */}
                  {selectedProfile.skills && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        Skills & Expertise
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {selectedProfile.skills.map((skill, index) => (
                          <motion.span
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-200 transition-colors"
                          >
                            {skill.name}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Social Links */}
                  {(selectedProfile.socialLinks?.linkedin ||
                    selectedProfile.socialLinks?.github ||
                    selectedProfile.socialLinks?.twitter ||
                    selectedProfile.socialLinks?.portfolio) && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                        Social Links
                      </h3>
                      <div className="space-y-4">
                        {selectedProfile.socialLinks?.linkedin && (
                          <a href={selectedProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span className="font-medium">LinkedIn Profile</span>
                          </a>
                        )}
                        {selectedProfile.socialLinks?.github && (
                          <a href={selectedProfile.socialLinks.github} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="font-medium">GitHub Profile</span>
                          </a>
                        )}
                        {selectedProfile.socialLinks?.portfolio && (
                          <a href={selectedProfile.socialLinks.portfolio} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="font-medium">Portfolio Website</span>
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right Column - Professional Info */}
                <div className="space-y-6">
                  {/* Video Introduction */}
                  {selectedProfile.videoIntroduction && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Introduction Video
                      </h3>
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                        <video
                          controls
                          src={selectedProfile.videoIntroduction}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Experience Section */}
                  {selectedProfile.experience && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Professional Experience
                      </h3>
                      <div className="space-y-6">
                        {selectedProfile.experience.map((exp, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 p-6 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{exp.position}</h4>
                                <p className="text-gray-700 font-medium">{exp.company}</p>
                              </div>
                              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                                {exp.start} - {exp.end || "Present"}
                              </span>
                            </div>
                            {exp.description && (
                              <p className="text-gray-600 text-sm leading-relaxed">{exp.description}</p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Education Section */}
                  {selectedProfile.education && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        Education
                      </h3>
                      <div className="space-y-6">
                        {selectedProfile.education.map((edu, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 p-6 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{edu.degree}</h4>
                                <p className="text-gray-700 font-medium">{edu.institution}</p>
                              </div>
                              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                                {edu.year}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Modal Footer */}
            <div className="bg-white border-t border-gray-200 p-6 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={closeProfileModal}
                className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              >
                Close Profile
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AdminLayout>
  );
};

export default AdminUserManagement;
