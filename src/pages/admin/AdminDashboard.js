import React, { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import AdminLayout from "../../components/AdminLayout";
import axios from "../../api/api";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import EnhancedSkeleton from "../../components/admin/EnhancedSkeleton";
import { FaUsers, FaBuilding, FaBriefcase, FaChartLine, FaCheckCircle } from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const AdminDashboard = () => {
  // Enhanced state management with performance optimizations
  // Updated stats to reflect three-state job model
  const [stats, setStats] = useState({ users: 0, companies: 0, jobs: 0, openJobs: 0, deadlineReachedJobs: 0, closedJobs: 0 });
  const [userGrowth, setUserGrowth] = useState([]);
  const [jobTrends, setJobTrends] = useState([]);
  const [jobStats, setJobStats] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingJobTrends, setLoadingJobTrends] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Date filtering states
  const [userGrowthInterval, setUserGrowthInterval] = useState("monthly");
  const [jobTrendsInterval, setJobTrendsInterval] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState(dayjs().year());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedDay, setSelectedDay] = useState(dayjs().format("YYYY-MM-DD"));

  // Debug: log userGrowth data
  React.useEffect(() => {
    console.log("User Growth Data:", userGrowth);
  }, [userGrowth]);

  const handleIntervalChange = useCallback(
    async (type, interval) => {
      const adminToken = localStorage.getItem("adminToken");
      if (type === "userGrowth") {
        setUserGrowthInterval(interval);
        let url = `/admin/user-growth?interval=${interval}`;
        if (interval === "monthly") {
          url += `&month=${selectedMonth}&year=${selectedMonthYear}`;
        } else if (interval === "yearly") {
          url += `&year=${selectedYear}`;
        } else if (interval === "hourly") {
          url += `&date=${selectedDay}`;
        }

        setLoadingJobTrends(true);
        try {
          const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${adminToken}` },
            withCredentials: true,
          });
          setUserGrowth(response.data);
          setError(null);
        } catch (err) {
          console.error("Error fetching user growth:", err);
          setError("Failed to load user growth data");
        } finally {
          setLoadingJobTrends(false);
        }
      } else if (type === "jobTrends") {
        setJobTrendsInterval(interval);
        setLoadingJobTrends(true);
        let url = `/admin/job-trends?interval=${interval}`;
        if (interval === "monthly") {
          url += `&month=${selectedMonth}&year=${selectedMonthYear}`;
        } else if (interval === "yearly") {
          url += `&year=${selectedYear}`;
        } else if (interval === "hourly") {
          url += `&date=${selectedDay}`;
        }

        try {
          const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${adminToken}` },
            withCredentials: true,
          });
          setJobTrends(response.data);
          setError(null);
        } catch (error) {
          setError("Failed to load job trends data. Please try again later.");
        } finally {
          setLoadingJobTrends(false);
        }
      }
    },
    [selectedMonth, selectedMonthYear, selectedYear, selectedDay]
  );

  // Enhanced data fetching with retry mechanism
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const adminToken = localStorage.getItem("adminToken");
    console.log("Admin token:", adminToken ? "Present" : "Missing");
    console.log("Starting dashboard data fetch...");

    if (!adminToken) {
      setError("Admin authentication required. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const [
        statsRes,
        growthRes,
        jobTrendsRes,
        jobStatsRes,
      ] = await Promise.all([
        axios.get("/admin/stats", {
          headers: { Authorization: `Bearer ${adminToken}` },
          withCredentials: true,
        }),
        axios.get("/admin/user-growth", {
          headers: { Authorization: `Bearer ${adminToken}` },
          withCredentials: true,
        }),
        axios.get("/admin/job-trends", {
          headers: { Authorization: `Bearer ${adminToken}` },
          withCredentials: true,
        }),
        axios.get("/admin/job-stats", {
          headers: { Authorization: `Bearer ${adminToken}` },
          withCredentials: true,
        }),
      ]);

      console.log("Dashboard data loaded successfully:");
      console.log("Stats:", statsRes.data);
      console.log("User Growth:", growthRes.data);
      console.log("Job Trends:", jobTrendsRes.data);
      console.log("Job Stats:", jobStatsRes.data);

      setStats(statsRes.data);
      setUserGrowth(growthRes.data);
      setJobTrends(jobTrendsRes.data);
      setJobStats(jobStatsRes.data);

      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      console.error("Error response:", err.response?.data);
      setError("Failed to load dashboard data. Please check if the backend server is running and try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const intervalOptions = [
    { value: "hourly", label: "Hourly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  const formatLabels = (data, interval) => {
    if (!data || data.length === 0) {
      // Return default labels based on interval
      if (interval === "hourly") return Array.from({ length: 24 }, (_, i) => `${i}:00`);
      if (interval === "yearly") return Array.from({ length: 12 }, (_, i) => (new Date().getFullYear() - i).toString());
      if (interval === "monthly") {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        return Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) =>
          dayjs(`${currentYear}-${currentMonth}-${i + 1}`).format("DD MMM")
        );
      }
      return [];
    }
    if (interval === "hourly") return data.map((item) => `${item.interval}:00`);
    if (interval === "yearly")
      return data.map((item) => item.interval.toString());
    if (interval === "monthly") {
      return data.map((item) =>
        dayjs(`${selectedMonthYear}-${selectedMonth}-${item.interval}`).format(
          "DD MMM"
        )
      );
    }
    return data.map((item) => `${item.interval}`);
  };

  const barData = {
    labels: formatLabels(userGrowth, userGrowthInterval),
    datasets: [
      {
        label: "User Growth",
        data: userGrowth.length > 0 ? userGrowth.map((data) => data.count || 0) : [0],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: "rgba(59, 130, 246, 0.9)",
      },
    ],
  };

  const lineData = {
    labels: formatLabels(jobTrends, jobTrendsInterval),
    datasets: [
      {
        label: "Job Postings",
        data: jobTrends.length > 0 ? jobTrends.map((data) => data.count || 0) : [0],
        borderColor: "rgba(139, 92, 246, 1)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(139, 92, 246, 1)",
        pointBorderColor: "#FFF",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  };

  // Derive job status distribution from consolidated stats (includes deadline reached slice)
  const jobStatsData = {
    labels: ["Open", "Deadline Reached", "Closed"],
    datasets: [
      {
        label: "Job Status Distribution",
        data: [
          stats.openJobs || 0,
          stats.deadlineReachedJobs || 0,
          stats.closedJobs || 0,
        ],
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)",      // Open - green
          "rgba(245, 158, 11, 0.85)",      // Deadline Reached - amber
          "rgba(239, 68, 68, 0.85)",       // Closed - red
        ],
        borderColor: ["#FFF", "#FFF", "#FFF"],
        borderWidth: 3,
        borderRadius: 8,
      },
    ],
  };
  const handleRetry = () => {
    setRetryCount(0);
    fetchDashboardData();
  };

  return (
    <AdminLayout>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Enhanced Header Section */}
          <div className="mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 sm:p-6 lg:p-7"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-2xl"></div>

              <div className="relative">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                      Admin Dashboard
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-1">
                      Welcome back! Here's what's happening with your platform today.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        {dayjs().format("dddd, MMMM D, YYYY • h:mm A")}
                      </span>
                      {retryCount > 0 && (
                        <span className="flex items-center gap-2 text-amber-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Retry attempt {retryCount}
                        </span>
                      )}
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

          {/* Enhanced Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg mb-8 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRetry}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Enhanced Professional Loading State */}
          {isLoading ? (
            <EnhancedSkeleton type="dashboard" />
          ) : (
            <>
              {/* Professional Stats Cards - Enhanced */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
                {/* Total Users Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-5 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] border border-blue-500/20 backdrop-blur-sm overflow-hidden"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 opacity-50"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-12 translate-x-12"></div>

                  <div className="relative flex items-center justify-between h-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        <h3 className="text-blue-100 text-xs font-semibold uppercase tracking-wider">
                          Total Users
                        </h3>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                        {stats.users?.toLocaleString() || "0"}
                      </p>
                      <div className="pt-3 border-t border-white/20">
                        <div className="flex items-center text-xs text-blue-100/90">
                          <svg className="w-3 h-3 mr-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="font-medium">
                            {userGrowth.length > 0 ?
                              `+${userGrowth.reduce((sum, item) => sum + (item.count || 0), 0)} new users this month` :
                              "No user registrations yet"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-white/20 to-white/10 p-3 rounded-xl ml-4 flex-shrink-0 backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-300">
                      <FaUsers className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                    </div>
                  </div>
                </motion.div>

                {/* Total Companies Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 text-white p-5 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] border border-emerald-500/20 backdrop-blur-sm overflow-hidden"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 opacity-50"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-12 translate-x-12"></div>

                  <div className="relative flex items-center justify-between h-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        <h3 className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                          Total Companies
                        </h3>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                        {stats.companies?.toLocaleString() || "0"}
                      </p>
                      <div className="pt-3 border-t border-white/20">
                        <div className="flex items-center text-xs text-emerald-100/90">
                          <svg className="w-3 h-3 mr-2 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium">
                            {stats.companies > 0 ?
                              `${stats.companies.toLocaleString()} companies registered` :
                              "No companies registered yet"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-white/20 to-white/10 p-3 rounded-xl ml-4 flex-shrink-0 backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-300">
                      <FaBuilding className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                    </div>
                  </div>
                </motion.div>

                {/* Total Jobs Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white p-5 sm:p-6 lg:p-7 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] border border-amber-500/20 backdrop-blur-sm overflow-hidden"
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 opacity-50"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-12 translate-x-12"></div>

                  <div className="relative flex items-center justify-between h-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        <h3 className="text-amber-100 text-xs font-semibold uppercase tracking-wider">
                          Total Jobs
                        </h3>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                        {stats.jobs?.toLocaleString() || "0"}
                      </p>
                      <div className="pt-3 border-t border-white/20">
                        <div className="flex items-center text-xs text-amber-100/90">
                          <FaCheckCircle className="w-3 h-3 mr-2 text-amber-200" />
                          <span className="font-medium">
                            {stats.jobs > 0 ?
                              `${stats.openJobs?.toLocaleString() || 0} open • ${stats.deadlineReachedJobs?.toLocaleString() || 0} expired • ${stats.closedJobs?.toLocaleString() || 0} closed` :
                              'No job postings yet'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-white/20 to-white/10 p-3 rounded-xl ml-4 flex-shrink-0 backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-300">
                      <FaBriefcase className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* User Growth Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group relative bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 backdrop-blur-sm hover:border-gray-300/50"
                >
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-xl sm:rounded-2xl"></div>

                  <div className="relative">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-3 sm:mb-4 gap-2 sm:gap-3">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">User Growth Trends</h2>
                        <p className="text-sm text-gray-600">Track user registration patterns over time</p>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <div className="relative">
                          <select
                            className="appearance-none px-3 py-1.5 sm:px-3 sm:py-2 text-sm bg-white border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            value={userGrowthInterval}
                            onChange={(e) => handleIntervalChange("userGrowth", e.target.value)}
                            disabled={isLoading}
                          >
                            {intervalOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {userGrowthInterval === "monthly" && (
                          <>
                            <select
                              value={selectedMonth}
                              onChange={(e) => {
                                setSelectedMonth(Number(e.target.value));
                                handleIntervalChange("userGrowth", "monthly");
                              }}
                              disabled={isLoading}
                              className="px-2 py-1.5 sm:px-2 sm:py-1.5 text-sm bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-md transition-all duration-200 shadow-sm"
                            >
                              {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {dayjs().month(i).format("MMM")}
                                </option>
                              ))}
                            </select>
                            <select
                              value={selectedMonthYear}
                              onChange={(e) => {
                                setSelectedMonthYear(Number(e.target.value));
                                handleIntervalChange("userGrowth", "monthly");
                              }}
                              disabled={isLoading}
                              className="px-2 py-1.5 sm:px-2 sm:py-1.5 text-sm bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-md transition-all duration-200 shadow-sm"
                            >
                              {[...Array(6)].map((_, i) => (
                                <option key={i} value={dayjs().year() - i}>
                                  {dayjs().year() - i}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                        {userGrowthInterval === "yearly" && (
                          <select
                            value={selectedYear}
                            onChange={(e) => {
                              setSelectedYear(Number(e.target.value));
                              handleIntervalChange("userGrowth", "yearly");
                            }}
                            disabled={isLoading}
                            className="px-2 py-1.5 sm:px-2 sm:py-1.5 text-sm bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-md transition-all duration-200 shadow-sm"
                          >
                            {[...Array(6)].map((_, i) => (
                              <option key={i} value={dayjs().year() - i}>
                                {dayjs().year() - i}
                              </option>
                            ))}
                          </select>
                        )}
                        {userGrowthInterval === "hourly" && (
                          <input
                            type="date"
                            value={selectedDay}
                            onChange={(e) => {
                              setSelectedDay(e.target.value);
                              handleIntervalChange("userGrowth", "hourly");
                            }}
                            disabled={isLoading}
                            className="px-2 py-1.5 sm:px-2 sm:py-1.5 text-sm bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-md transition-all duration-200 shadow-sm"
                            max={dayjs().format("YYYY-MM-DD")}
                          />
                        )}
                      </div>
                    </div>
                    <div className="h-48 sm:h-56 lg:h-64 relative">
                      {userGrowth.length > 0 ? (
                        <Bar
                          data={barData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                backgroundColor: "rgba(59, 130, 246, 0.95)",
                                titleColor: "#FFF",
                                bodyColor: "#FFF",
                                borderColor: "rgba(255, 255, 255, 0.3)",
                                borderWidth: 1,
                                padding: 12,
                                cornerRadius: 8,
                                displayColors: false,
                                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
                              },
                            },
                            scales: {
                              x: {
                                grid: { display: false, drawBorder: false },
                                ticks: { color: "#6B7280", font: { size: 9, weight: '600' } },
                              },
                              y: {
                                beginAtZero: true,
                                grid: { color: "rgba(0,0,0,0.06)", drawBorder: false },
                                ticks: { color: "#6B7280", font: { size: 9, weight: '600' } },
                              },
                            },
                            elements: {
                              bar: {
                                borderRadius: 6,
                                hoverBorderRadius: 8,
                              },
                            },
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                              <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No user growth data available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Job Trends Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group relative bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 backdrop-blur-sm hover:border-gray-300/50"
                >
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-indigo-50/30 rounded-xl sm:rounded-2xl"></div>

                  <div className="relative">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-3 sm:mb-4 gap-2 sm:gap-3">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">Job Posting Trends</h2>
                        <p className="text-sm text-gray-600">Monitor job market activity and posting patterns</p>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <div className="relative">
                          <select
                            className="appearance-none px-3 py-1.5 sm:px-3 sm:py-2 text-sm bg-white border-2 border-purple-200 hover:border-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            value={jobTrendsInterval}
                            onChange={(e) => handleIntervalChange("jobTrends", e.target.value)}
                            disabled={isLoading || loadingJobTrends}
                          >
                            {intervalOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {jobTrendsInterval === "monthly" && (
                          <>
                            <select
                              value={selectedMonth}
                              onChange={(e) => {
                                setSelectedMonth(Number(e.target.value));
                                handleIntervalChange("jobTrends", "monthly");
                              }}
                              disabled={isLoading || loadingJobTrends}
                              className="px-2 py-1.5 sm:px-2 sm:py-1.5 text-sm bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-md transition-all duration-200 shadow-sm"
                            >
                              {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {dayjs().month(i).format("MMM")}
                                </option>
                              ))}
                            </select>
                            <select
                              value={selectedMonthYear}
                              onChange={(e) => {
                                setSelectedMonthYear(Number(e.target.value));
                                handleIntervalChange("jobTrends", "monthly");
                              }}
                              disabled={isLoading || loadingJobTrends}
                              className="px-2 py-1.5 sm:px-2 sm:py-1.5 text-sm bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-md transition-all duration-200 shadow-sm"
                            >
                              {[...Array(6)].map((_, i) => (
                                <option key={i} value={dayjs().year() - i}>
                                  {dayjs().year() - i}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                        {jobTrendsInterval === "yearly" && (
                          <select
                            value={selectedYear}
                            onChange={(e) => {
                              setSelectedYear(Number(e.target.value));
                              handleIntervalChange("jobTrends", "yearly");
                            }}
                            disabled={isLoading || loadingJobTrends}
                            className="px-2 py-1.5 sm:px-2 sm:py-1.5 text-sm bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-md transition-all duration-200 shadow-sm"
                          >
                            {[...Array(6)].map((_, i) => (
                              <option key={i} value={dayjs().year() - i}>
                                {dayjs().year() - i}
                              </option>
                            ))}
                          </select>
                        )}
                        {jobTrendsInterval === "hourly" && (
                          <input
                            type="date"
                            value={selectedDay}
                            onChange={(e) => {
                              setSelectedDay(e.target.value);
                              handleIntervalChange("jobTrends", "hourly");
                            }}
                            disabled={isLoading || loadingJobTrends}
                            className="px-2 py-1.5 sm:px-2 sm:py-1.5 text-sm bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-md transition-all duration-200 shadow-sm"
                            max={dayjs().format("YYYY-MM-DD")}
                          />
                        )}
                      </div>
                    </div>
                    {loadingJobTrends ? (
                      <div className="flex justify-center items-center h-48 sm:h-56 lg:h-64">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-4 border-purple-200"></div>
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-4 border-purple-500 border-t-transparent absolute inset-0"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 sm:h-56 lg:h-64">
                        {jobTrends.length > 0 ? (
                          <Line
                            data={lineData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  backgroundColor: "rgba(139, 92, 246, 0.95)",
                                  titleColor: "#FFF",
                                  bodyColor: "#FFF",
                                  borderColor: "rgba(255, 255, 255, 0.3)",
                                  borderWidth: 1,
                                  padding: 12,
                                  cornerRadius: 8,
                                  displayColors: false,
                                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
                                },
                              },
                              scales: {
                                x: {
                                  grid: { display: false, drawBorder: false },
                                  ticks: { color: "#6B7280", font: { size: 9, weight: '600' } },
                                },
                                y: {
                                  beginAtZero: true,
                                  grid: { color: "rgba(0,0,0,0.06)", drawBorder: false },
                                  ticks: { color: "#6B7280", font: { size: 9, weight: '600' } },
                                },
                              },
                              elements: {
                                line: {
                                  tension: 0.4,
                                  borderWidth: 3,
                                },
                                point: {
                                  radius: 4,
                                  hoverRadius: 6,
                                  borderWidth: 2,
                                  hoverBorderWidth: 3,
                                },
                              },
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                              </div>
                              <p className="text-sm text-gray-500 font-medium">No job trends data available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Job Status Distribution */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="group relative bg-white p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 backdrop-blur-sm hover:border-gray-300/50"
                >
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-transparent to-orange-50/30 rounded-xl sm:rounded-2xl"></div>

                  <div className="relative">
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">Job Status Overview</h2>
                    <p className="text-sm text-gray-600 mb-3 sm:mb-4">Distribution of job posting statuses</p>
                    <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center">
                      <Pie
                        data={jobStatsData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: {
                                padding: 15,
                                font: { size: 10, weight: '600' },
                                color: '#374151',
                                usePointStyle: true,
                                pointStyle: 'rectRounded',
                              },
                            },
                            tooltip: {
                              backgroundColor: "rgba(0,0,0,0.9)",
                              titleColor: "#FFF",
                              bodyColor: "#FFF",
                              padding: 12,
                              cornerRadius: 8,
                              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                              callbacks: {
                                label: (context) => {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = Math.round((context.parsed * 100) / total);
                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                              }
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
