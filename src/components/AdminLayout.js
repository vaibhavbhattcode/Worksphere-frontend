import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiSettings,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronDown,
  FiGrid,
  FiClipboard,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: <FiHome className="w-5 h-5" />,
    description: "Overview and analytics"
  },
  {
    label: "Users",
    to: "/admin/users",
    icon: <FiUsers className="w-5 h-5" />,
    description: "Manage user accounts"
  },
  {
    label: "Companies",
    to: "/admin/companies",
    icon: <FiBriefcase className="w-5 h-5" />,
    description: "Company management"
  },
  {
    label: "Jobs",
    to: "/admin/jobs",
    icon: <FiClipboard className="w-5 h-5" />,
    description: "Manage job postings"
  },
  {
    label: "Industry",
    to: "/admin/industries",
    icon: <FiGrid className="w-5 h-5" />,
    description: "Manage industries"
  },
];

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
      mass: 0.8
    }
  },
  closed: {
    x: "-100%",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
      mass: 0.8
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  }),
};

const AdminSidebar = ({ sidebarOpen, toggleSidebar, windowWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Clear admin session data
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    
    // Redirect to login page
    navigate("/admin/login");
  };

  return (
    <AnimatePresence>
      {(sidebarOpen || windowWidth >= 1024) && (
        <motion.aside
          initial="closed"
          animate="open"
          exit="closed"
          variants={sidebarVariants}
          className="fixed top-0 left-0 h-full bg-white shadow-xl border-r border-gray-100 z-50 w-72 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">WS</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  WorkSphere
                </h1>
                <p className="text-xs text-gray-600 font-medium">Admin Panel</p>
              </div>
            </div>
            {windowWidth < 1024 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                onClick={toggleSidebar}
                aria-label="Close sidebar"
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navItems.map(({ label, to, icon, description }, index) => (
                <motion.div
                  key={to}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                >
                  <Link
                    to={to}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 relative ${
                      isActive(to)
                        ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                        : "hover:shadow-sm"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      isActive(to)
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    }`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{label}</div>
                      <div className={`text-xs transition-colors ${
                        isActive(to) ? "text-indigo-600" : "text-gray-500"
                      }`}>
                        {description}
                      </div>
                    </div>
                    {isActive(to) && (
                      <div className="absolute right-2 w-2 h-2 bg-indigo-600 rounded-full"></div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <FiLogOut className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">Sign Out</span>
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call once to set initial state

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        windowWidth={windowWidth}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen && windowWidth >= 1024 ? "ml-72" : "ml-0"
        }`}
      >
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white shadow-sm border-b border-gray-100 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {windowWidth < 1024 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Open sidebar"
              >
                <FiMenu className="w-5 h-5" />
              </motion.button>
            )}

            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your platform efficiently</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
