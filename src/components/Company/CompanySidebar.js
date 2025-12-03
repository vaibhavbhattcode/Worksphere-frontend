
// CompanySidebar.js - Simple & Attractive Company Panel Sidebar
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBriefcase,
  FaUser,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaBuilding,
  FaCrown,
  FaBars,
  FaTimes,
  FaRocket,
  FaUsers,
  FaFileAlt,
  FaChartLine
} from "react-icons/fa";
import axiosInstance from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
const navigationItems = [
  {
    name: "Dashboard",
    icon: <FaTachometerAlt />,
    path: "/company",
    exact: true,
    description: "Overview",
    color: "blue"
  },
  {
    name: "Job Postings",
    icon: <FaBriefcase />,
    path: "/company/jobs",
    description: "Post Jobs",
    color: "green"
  },
  {
    name: "Posted Jobs",
    icon: <FaFileAlt />,
    path: "/company/posted-jobs",
    description: "Active Jobs",
    color: "purple"
  },
  {
    name: "Applications",
    icon: <FaUsers />,
    path: "/company/applications",
    description: "Candidates",
    color: "indigo"
  },
  {
    name: "Chat",
    icon: <FaUsers />,
    path: "/company/chat",
    description: "Messages",
    color: "blue"
  },
  {
    name: "Notifications",
    icon: <FaBell />,
    path: "/company/notifications",
    description: "Alerts",
    color: "red"
  },
  {
    name: "Profile",
    icon: <FaUser />,
    path: "/company/profile",
    description: "Settings",
    color: "cyan"
  }
];

const NAV_COLORS = {
  blue: {
    active: "from-blue-600 to-blue-700",
    inactive: "from-blue-500/20 to-blue-600/20",
  },
  green: {
    active: "from-green-600 to-green-700",
    inactive: "from-green-500/20 to-green-600/20",
  },
  purple: {
    active: "from-purple-600 to-purple-700",
    inactive: "from-purple-500/20 to-purple-600/20",
  },
  indigo: {
    active: "from-indigo-600 to-indigo-700",
    inactive: "from-indigo-500/20 to-indigo-600/20",
  },
  cyan: {
    active: "from-cyan-600 to-cyan-700",
    inactive: "from-cyan-500/20 to-cyan-600/20",
  },
  orange: {
    active: "from-orange-600 to-orange-700",
    inactive: "from-orange-500/20 to-orange-600/20",
  },
  red: {
    active: "from-red-600 to-red-700",
    inactive: "from-red-500/20 to-red-600/20",
  },
  gray: {
    active: "from-gray-600 to-gray-700",
    inactive: "from-gray-500/20 to-gray-600/20",
  },
};

const getNavClasses = (isActive, color) => {
  const palette = NAV_COLORS[color] || NAV_COLORS.blue;
  const gradient = isActive ? palette.active : palette.inactive;
  const base = "group relative flex items-center gap-2 py-2.5 px-2.5 rounded-md transition-all duration-200";
  return isActive
    ? `${base} bg-gradient-to-r ${gradient} text-white shadow-sm`
    : `${base} text-slate-300 hover:bg-white/10 hover:text-white bg-gradient-to-r ${gradient}`;
};

const getIconClasses = (isActive) =>
  isActive
    ? "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 bg-white/20 text-white"
    : "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 bg-slate-700/50 text-slate-400 group-hover:bg-white/20 group-hover:text-white";

const CompanySidebar = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch company profile data
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication status
        const authRes = await axiosInstance.get("/company/auth/status");

        if (!authRes.data.loggedIn || authRes.data.type !== "company") {
          navigate("/company/login");
          return;
        }

        // Fetch company profile
        const profileRes = await axiosInstance.get("/company/profile");

        if (profileRes.data.company) {
          setCompanyData(profileRes.data.company);
        }
        
        // Fetch unread notification count
        try {
          const notifRes = await axiosInstance.get("/company/notifications/unread-count");
          setNotificationsCount(notifRes.data.count || 0);
        } catch (err) {
          console.error("Error fetching notification count:", err);
        }
      } catch (err) {
        console.error("Error fetching company data:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/company/login");
        } else {
          setError("Failed to load company profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [navigate]);

  // Real-time notification count updates
  useEffect(() => {
    if (!socket) return;

    const handleNotificationCountUpdated = ({ count }) => {
      console.log("Company notification count updated:", count);
      setNotificationsCount(count);
    };

    socket.on("notificationCountUpdated", handleNotificationCountUpdated);

    return () => {
      socket.off("notificationCountUpdated", handleNotificationCountUpdated);
    };
  }, [socket]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (isLoggingOut) return; // prevent double clicks
    setIsLoggingOut(true);
    try {
      // Best-effort server notification (stateless JWT logout)
      await axiosInstance.post("/company/auth/logout");
    } catch (error) {
      // Ignore server errors – client side cleanup still proceeds
      console.warn("Company logout server call failed (continuing):", error?.response?.status || error?.message);
    } finally {
      try {
        // Clear all possible auth artifacts for companies
        localStorage.removeItem("companyToken");
        localStorage.removeItem("company");
        // Also clear generic token if company flow reused it
        localStorage.removeItem("token");
      } catch (e) {
        console.warn("LocalStorage cleanup failed", e);
      }
      // Navigation reset
      navigate("/company/login", { replace: true });
      // Small delay to re-enable button after navigation (safety if component persists briefly)
      setTimeout(() => setIsLoggingOut(false), 800);
    }
  };

  // Animation variants
  const sidebarVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  const mobileVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-80 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl z-30 h-screen border-r border-slate-700/30"
      >
        {/* Compact Header */}
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <FaBuilding className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-base font-bold text-white">WorkSphere</h1>
              <p className="text-xs text-blue-300">Company Portal</p>
            </div>
          </div>
        </div>

        {/* Compact Navigation - No Scroll */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          <ul className="space-y-0.5">
            {navigationItems.map((item, index) => (
              <motion.li
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <NavLink
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) => getNavClasses(isActive, item.color)}
                  title={item.description}
                >
                  {({ isActive }) => (
                    <>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={getIconClasses(isActive)}
                      >
                        {item.icon}
                      </motion.div>
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.name === "Notifications" && notificationsCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                        >
                          {notificationsCount > 99 ? "99+" : notificationsCount}
                        </motion.span>
                      )}
                    </>
                  )}
                </NavLink>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* Compact Footer */}
        <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
          <motion.button
            whileHover={isLoggingOut ? {} : { scale: 1.02 }}
            whileTap={isLoggingOut ? {} : { scale: 0.98 }}
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`group relative flex items-center gap-2 w-full text-left py-2 px-3 rounded-md bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 transition-all duration-200 text-sm font-medium border border-red-500/20 ${
              isLoggingOut
                ? "opacity-60 cursor-not-allowed"
                : "hover:text-white hover:from-red-600/30 hover:to-red-700/30 hover:border-red-400/50"
            }`}
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span>{isLoggingOut ? "Signing Out…" : "Sign Out"}</span>
          </motion.button>

          <div className="mt-2 pt-2 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-400">© 2025 WorkSphere</p>
          </div>
        </div>
      </motion.div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-3 z-50 flex items-center justify-between shadow-xl border-b border-slate-700/50">
        <motion.div
          className="flex items-center space-x-2"
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
            <FaBuilding className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">WorkSphere</h1>
            <p className="text-xs text-blue-300">Company Portal</p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-all duration-200"
        >
          <FaBars className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              variants={mobileVariants}
              className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white w-80 h-full shadow-2xl border-r border-slate-700/30"
            >
              {/* Mobile Header */}
              <div className="p-3 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                      <FaBuilding className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold text-white">WorkSphere</h1>
                      <p className="text-xs text-blue-300">Company Portal</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-all duration-200"
                  >
                    <FaTimes className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Mobile Navigation - No Scroll */}
              <nav className="flex-1 px-3 py-3 space-y-1">
                <ul className="space-y-0.5">
                  {navigationItems.map((item, index) => (
                    <motion.li
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <NavLink
                        to={item.path}
                        end={item.exact}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) => getNavClasses(isActive, item.color)}
                        title={item.description}
                      >
                        {({ isActive }) => (
                          <>
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className={getIconClasses(isActive)}
                            >
                              {item.icon}
                            </motion.div>
                            <span className="text-sm font-medium">{item.name}</span>

                            {item.name === "Notifications" && notificationsCount > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                              >
                                {notificationsCount > 99 ? "99+" : notificationsCount}
                              </motion.span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Mobile Footer */}
              <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
                <motion.button
                  whileHover={isLoggingOut ? {} : { scale: 1.02 }}
                  whileTap={isLoggingOut ? {} : { scale: 0.98 }}
                  onClick={() => { if (!isLoggingOut) { setIsOpen(false); handleLogout(); } }}
                  disabled={isLoggingOut}
                  className={`group relative flex items-center gap-2 w-full text-left py-2 px-3 rounded-md bg-gradient-to-r from-red-600/20 to-red-700/20 text-red-300 transition-all duration-200 text-sm font-medium border border-red-500/20 ${
                    isLoggingOut
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:text-white hover:from-red-600/30 hover:to-red-700/30 hover:border-red-400/50"
                  }`}
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span>{isLoggingOut ? "Signing Out…" : "Sign Out"}</span>
                </motion.button>

                <div className="mt-2 pt-2 border-t border-slate-700/50 text-center">
                  <p className="text-xs text-slate-400">© 2025 WorkSphere</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CompanySidebar;
