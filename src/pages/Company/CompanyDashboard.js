import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import CompanySidebar from "../../components/Company/CompanySidebar";
import {
  FaBriefcase,
  FaUsers,
  FaCalendar,
  FaBell,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaEye,
  FaTrendingUp,
  FaTrendingDown,
  FaUserCheck,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaSyncAlt,
  FaFilter,
  FaCalendarAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSocket } from "../../context/SocketContext";

const COLORS = {
  primary: "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  teal: "#14B8A6",
};

const CompanyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [interval, setInterval] = useState("months");
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState("overall"); // overall, today, week, month, year, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      // Build query params based on date filter
      let queryParams = `interval=${interval}`;
      
      if (dateFilter === "today") {
        const today = new Date();
        queryParams += `&startDate=${today.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`;
      } else if (dateFilter === "week") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        queryParams += `&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      } else if (dateFilter === "month") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        queryParams += `&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      } else if (dateFilter === "year") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        queryParams += `&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      } else if (dateFilter === "custom" && customStartDate && customEndDate) {
        queryParams += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      
      const [dashRes, notifRes] = await Promise.all([
        axiosInstance.get(`/company/dashboard/overview?${queryParams}`),
        axiosInstance.get("/company/notifications"),
      ]);
      
      console.log("=== DASHBOARD DATA RECEIVED ===");
      console.log("Dashboard Data:", dashRes.data);
      console.log("Metrics:", dashRes.data?.metrics);
      console.log("Upcoming Interviews:", dashRes.data?.metrics?.upcomingInterviews);
      console.log("Notifications Data:", notifRes.data);
      console.log("Notifications count:", notifRes.data?.length);
      
      setDashboardData(dashRes.data);
      setNotifications(notifRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      console.error("Error details:", err.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [interval, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (notification) => {
      console.log("New notification received on dashboard:", notification);
      setNotifications((prev) => [notification, ...prev]);
      // Optionally refresh dashboard metrics when new application comes
      if (notification.type === "application") {
        fetchData();
      }
    };
    
    socket.on("notification", handleNewNotification);
    
    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <CompanySidebar />
        <div className="flex-1 md:ml-80 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-80 bg-gray-200 rounded-xl" />
              <div className="h-80 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {};
  const company = dashboardData?.company || {};

  // Calculate stats with proper fallbacks
  const totalApps = metrics.totalApplications || 0;
  const pendingApps = metrics.pendingApplications || 0;
  const acceptedApps = metrics.acceptedApplications || 0;
  const rejectedApps = metrics.rejectedApplications || 0;
  const viewedApps = metrics.viewedApplications || 0;
  const activeJobs = metrics.activeJobs || 0;
  const closedJobs = metrics.closedJobs || 0;
  const totalJobs = metrics.totalJobPostings || 0;
  const scheduledInterviews = metrics.interviewsScheduled || 0;
  const completedInterviews = metrics.completedInterviews || 0;
  
  const acceptanceRate = totalApps > 0 ? ((acceptedApps / totalApps) * 100).toFixed(1) : 0;
  const pendingRate = totalApps > 0 ? ((pendingApps / totalApps) * 100).toFixed(1) : 0;
  const rejectionRate = totalApps > 0 ? ((rejectedApps / totalApps) * 100).toFixed(1) : 0;

  // Chart data with all statuses
  const statusData = [
    { name: "Pending", value: pendingApps, color: COLORS.warning },
    { name: "Accepted", value: acceptedApps, color: COLORS.success },
    { name: "Rejected", value: rejectedApps, color: COLORS.danger },
    { name: "Viewed", value: viewedApps, color: COLORS.info },
  ].filter(item => item.value > 0);

  // Application trends data
  const trendsData = metrics.applicationTrends || [];
  
  // Upcoming interviews data
  const upcomingInterviews = metrics.upcomingInterviews || [];

  // Get filter label
  const getFilterLabel = () => {
    switch(dateFilter) {
      case "today": return "Today";
      case "week": return "Last 7 Days";
      case "month": return "Last 30 Days";
      case "year": return "Last Year";
      case "custom": return customStartDate && customEndDate ? `${customStartDate} to ${customEndDate}` : "Custom Range";
      default: return "All Time";
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, changeType, color, subtitle }) => (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-lg bg-${color}-50`}>
              <Icon className={`text-${color}-600 text-2xl`} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            changeType === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {changeType === 'up' ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
            <span className="text-xs font-semibold">{change}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <CompanySidebar />
      <div className="flex-1 md:ml-80 overflow-hidden">
        <div className="h-screen overflow-y-auto p-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Company Dashboard
                </h1>
                <p className="text-gray-600">Welcome back, {company.companyName || "Company"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Date Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FaFilter className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{getFilterLabel()}</span>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                    >
                      <div className="p-3 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900">Date Range Filter</h3>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => { setDateFilter("overall"); setShowFilterMenu(false); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            dateFilter === "overall" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          All Time (Overall)
                        </button>
                        <button
                          onClick={() => { setDateFilter("today"); setShowFilterMenu(false); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            dateFilter === "today" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Today
                        </button>
                        <button
                          onClick={() => { setDateFilter("week"); setShowFilterMenu(false); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            dateFilter === "week" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Last 7 Days
                        </button>
                        <button
                          onClick={() => { setDateFilter("month"); setShowFilterMenu(false); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            dateFilter === "month" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Last 30 Days
                        </button>
                        <button
                          onClick={() => { setDateFilter("year"); setShowFilterMenu(false); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            dateFilter === "year" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Last Year
                        </button>
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <button
                            onClick={() => setDateFilter("custom")}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              dateFilter === "custom" ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            Custom Range
                          </button>
                          {dateFilter === "custom" && (
                            <div className="mt-2 px-3 space-y-2">
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={customStartDate}
                                  onChange={(e) => setCustomStartDate(e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={customEndDate}
                                  onChange={(e) => setCustomEndDate(e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <button
                                onClick={() => setShowFilterMenu(false)}
                                className="w-full px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Refresh Button */}
                <motion.button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    refreshing 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  whileHover={!refreshing ? { scale: 1.05 } : {}}
                  whileTap={!refreshing ? { scale: 0.95 } : {}}
                >
                  <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </motion.button>
              </div>
            </div>

            {/* Active Filter Badge */}
            {dateFilter !== "overall" && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2"
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                  <FaCalendarAlt className="text-xs" />
                  Showing data for: {getFilterLabel()}
                  <button
                    onClick={() => setDateFilter("overall")}
                    className="ml-1 hover:text-indigo-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </motion.div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={FaBriefcase}
              title="Total Job Postings"
              value={totalJobs}
              subtitle={`${activeJobs} active • ${closedJobs} closed`}
              color="indigo"
            />
            <StatCard
              icon={FaUsers}
              title="Total Applications"
              value={totalApps}
              subtitle={`${acceptanceRate}% acceptance rate`}
              color="blue"
            />
            <StatCard
              icon={FaCalendar}
              title="Interviews Scheduled"
              value={scheduledInterviews}
              subtitle={`${completedInterviews} completed`}
              color="purple"
            />
            <StatCard
              icon={FaUserCheck}
              title="Hired Candidates"
              value={acceptedApps}
              subtitle={`${rejectionRate}% rejected`}
              color="green"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Application Trends */}
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FaChartLine className="text-indigo-600" />
                  Application Trends
                </h2>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="hours">Hourly</option>
                  <option value="months">Monthly</option>
                  <option value="years">Yearly</option>
                </select>
              </div>
              {trendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendsData}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="applications" 
                      stroke={COLORS.primary} 
                      fillOpacity={1} 
                      fill="url(#colorApps)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FaChartLine className="text-6xl text-gray-300 mx-auto mb-3" />
                    <p>No application trends data available</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Application Status Distribution */}
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Application Status</h2>
              {statusData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={85}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Custom Legend */}
                  <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    {statusData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700">{item.name}</p>
                          <p className="text-sm font-bold text-gray-900">{item.value}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {totalApps > 0 ? ((item.value / totalApps) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FaUsers className="text-6xl text-gray-300 mx-auto mb-3" />
                    <p>No application status data available</p>
                    <p className="text-sm mt-1">Start receiving applications to see the distribution</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Quick Stats */}
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaClock className="text-amber-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingApps}</p>
                    </div>
                  </div>
                  <span className="text-sm text-amber-700 font-semibold">{pendingRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Accepted</p>
                      <p className="text-2xl font-bold text-gray-900">{acceptedApps}</p>
                    </div>
                  </div>
                  <span className="text-sm text-green-700 font-semibold">{acceptanceRate}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaTimesCircle className="text-red-600 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Rejected</p>
                      <p className="text-2xl font-bold text-gray-900">{rejectedApps}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Notifications */}
            <motion.div 
              className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FaBell className="text-indigo-600" />
                  Recent Notifications
                </h2>
                <button
                  onClick={() => navigate("/company/notifications")}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.slice(0, 5).map((notif, index) => {
                  const date = new Date(notif.createdAt);
                  const now = new Date();
                  const diff = now - date;
                  const minutes = Math.floor(diff / 60000);
                  const hours = Math.floor(diff / 3600000);
                  const days = Math.floor(diff / 86400000);
                  
                  let timeAgo = minutes < 1 ? "Just now" :
                    minutes < 60 ? `${minutes}m ago` :
                    hours < 24 ? `${hours}h ago` :
                    days < 7 ? `${days}d ago` :
                    date.toLocaleDateString();

                  return (
                    <div
                      key={notif._id || index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        notif.isRead ? "bg-gray-50" : "bg-blue-50"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {notif.type === "application" ? (
                          <FaUsers className="text-blue-600" />
                        ) : notif.type === "interview" ? (
                          <FaCalendar className="text-purple-600" />
                        ) : (
                          <FaBell className="text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
                        </div>
                        {!notif.isRead && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No notifications yet</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Upcoming Interviews */}
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaCalendar className="text-purple-600" />
              Upcoming Interviews
              <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                {upcomingInterviews.length}
              </span>
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.map((interview, index) => (
                  <div
                    key={interview.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {(interview.candidateName || interview.candidateEmail)?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {interview.candidateName || interview.candidateEmail}
                        </p>
                        {interview.candidateName && (
                          <p className="text-xs text-gray-500">{interview.candidateEmail}</p>
                        )}
                        <p className="text-sm text-gray-600">{interview.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{interview.date}</p>
                      <span className="inline-block mt-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No upcoming interviews</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
