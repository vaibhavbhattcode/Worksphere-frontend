import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaBriefcase,
  FaRegUser,
  FaMoon,
  FaSun,
  FaBell,
  FaTimes,
  FaBars,
  FaUserCircle,
  FaSignOutAlt,
  FaUser,
  FaBuilding,
  FaListAlt,
} from "react-icons/fa";
import { Link as RouterLink } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { useSocket } from "../context/SocketContext";
import debounce from "lodash/debounce";

export default function Header() {
  const navigate = useNavigate();
  const { user, userType, logout, setUser } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { socket } = useSocket();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [notificationsTimeout, setNotificationsTimeout] = useState(null);

  const displayName = user?.name || "Account";
  const [unreadCount, setUnreadCount] = useState(0);

  // Debounced state update to prevent excessive re-renders
  const debouncedSetNotifications = useCallback(
    debounce((newNotifications) => {
      setNotifications(newNotifications);
    }, 100),
    []
  );

  // Fetch full user profile if needed
  useEffect(() => {
    let isMounted = true;
    const fetchUserProfile = async () => {
      try {
        if (userType === "user" && user && !user.name) {
          const res = await axiosInstance.get("/user/profile");
          if (isMounted) {
            setUser((prevUser) => ({ ...prevUser, ...res.data }));
          }
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          // Token invalid/expired; force logout UI state
          logout();
        } else {
          console.error("Error fetching user profile:", error);
        }
      }
    };
    fetchUserProfile();
    return () => {
      isMounted = false;
    };
  }, [userType, user, setUser]);

  // Fetch initial notifications
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        // Ensure only user notifications are fetched
        if (userType === "user" && user?._id) {
          const res = await axiosInstance.get("/notifications");
          if (isMounted) {
            setNotifications(res.data || []);
            setUnreadCount(res.data.filter((n) => !n.isRead).length);
          }
        } else {
          console.log("Skipping notification fetch for non-user type");
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          logout();
        } else {
          console.error("Error fetching notifications:", err);
        }
      }
    };

    if (userType === "user" && user?._id) {
      fetchNotifications();
    }

    return () => {
      isMounted = false;
    };
  }, [userType, user]);

  // Handle real-time notifications
  useEffect(() => {
    console.log("🔔 Header useEffect triggered:", { 
      hasSocket: !!socket, 
      hasUser: !!user, 
      userId: user?._id || user?.id,
      userType
    });

    if (!socket || (!user?._id && !user?.id)) {
      console.log("⚠️ Header: Skipping notification listeners setup - missing socket or user");
      return;
    }

    console.log("✅ Header: Setting up notification listeners for user:", user._id);

    const handleNotification = (notification) => {
      console.log("🔔 Header: Received notification:", notification);
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) {
          console.log("⚠️ Header: Duplicate notification ignored:", notification._id);
          return prev;
        }
        console.log("✅ Header: Adding notification to array");
        return [notification, ...prev];
      });
      
      // Increment unread count immediately when new notification arrives
      if (!notification.isRead) {
        setUnreadCount((prev) => {
          const newCount = prev + 1;
          console.log("📈 Header: Incrementing count:", prev, "→", newCount);
          return newCount;
        });
      }
    };

    const handleNotificationCountUpdated = ({ count }) => {
      console.log("🔢 Header: Notification count updated:", count);
      setUnreadCount(count);
    };

    const handleNotificationDeleted = ({ id }) => {
      console.log("🗑️ Header: Notification deleted:", id);
      setNotifications((prev) => {
        const notification = prev.find((n) => n._id === id);
        // If deleted notification was unread, decrement count
        if (notification && !notification.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    };

    const handleNotificationsCleared = () => {
      console.log("🧹 Header: All notifications cleared");
      setNotifications([]);
      setUnreadCount(0);
    };

    const handleNotificationsMarkedRead = ({ all }) => {
      console.log("✅ Header: Notifications marked as read:", all ? "all" : "some");
      if (all) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    };

    console.log("🎧 Header: Attaching socket listeners...");
    socket.on("notification", handleNotification);
    socket.on("notificationCountUpdated", handleNotificationCountUpdated);
    socket.on("notificationDeleted", handleNotificationDeleted);
    socket.on("notificationsCleared", handleNotificationsCleared);
    socket.on("notificationsMarkedRead", handleNotificationsMarkedRead);

    // Handle socket errors
    socket.on("connect_error", (error) => {
      console.error("❌ Header: Socket connection error:", error);
    });

    console.log("✅ Header: All notification listeners attached successfully");

    return () => {
      console.log("🔇 Header: Cleaning up notification listeners");
      socket.off("notification", handleNotification);
      socket.off("notificationCountUpdated", handleNotificationCountUpdated);
      socket.off("notificationDeleted", handleNotificationDeleted);
      socket.off("notificationsCleared", handleNotificationsCleared);
      socket.off("notificationsMarkedRead", handleNotificationsMarkedRead);
      socket.off("connect_error");
    };
  }, [socket, user]);

  // Logout handler
  const handleLogout = async () => {
    try {
      // Best-effort server logout (no-op with JWT), then clear client state
      await axiosInstance.post("/auth/logout");
    } catch (_) {
      // Ignore server errors for stateless logout
    } finally {
      // Clear all auth caches
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("companyToken");
      localStorage.removeItem("company");
      logout();
      navigate("/");
    }
  };

  // Enhanced toggleDarkMode to update html class
  const handleToggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    toggleDarkMode();
  };

  // Job seeker navigation links
  const navLinks = [
    { name: "Home", path: "/", aria: "Navigate to home page" },
    { name: "Find Jobs", path: "/jobs", aria: "Browse job listings" },
    { name: "Companies", path: "/companies", aria: "View companies" },
    { name: "Career Tips", path: "/career-tips", aria: "Professional career guidance and insights" },
  ];

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('#mobile-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 shadow-sm">
      <nav className="container mx-auto px-4 py-3" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          {/* Brand / Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group"
            aria-label="WorkSphere Home"
          >
            <FaBriefcase className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 transition-transform group-hover:scale-110" />
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Work<span className="text-blue-600">Sphere</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <ul className="flex space-x-6">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md transition-colors font-medium text-sm"
                    aria-label={link.aria}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button
                onClick={handleToggleDarkMode}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <FaSun className="w-5 h-5" />
                ) : (
                  <FaMoon className="w-5 h-5" />
                )}
              </button>

              {/* Chat quick access */}
              {userType === "user" && (
                <RouterLink
                  to="/chat"
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Open chat"
                >
                  {/* Simple chat bubble icon using svg to avoid extra imports */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
                </RouterLink>
              )}

              {/* Notifications */}
              {userType === "user" && user && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="View notifications"
                  >
                    <FaBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50 border border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                const apiPath = userType === "company" ? "/company/notifications/mark-all-read" : "/notifications/mark-all-read";
                                await axiosInstance.patch(apiPath);
                              } catch (err) {
                                console.error("Error marking all as read:", err);
                              }
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-gray-600 dark:text-gray-300 text-center">
                          No notifications
                        </div>
                      ) : (
                        <>
                          {notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification._id}
                              className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${
                                !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                              }`}
                              onClick={async () => {
                                // UX decision: clicking a notification in the header redirects
                                // to the full notifications page so the user can view details.
                                setShowNotifications(false);
                                try {
                                  // mark as read server-side (best-effort)
                                  const apiPath = userType === "company" 
                                    ? `/company/notifications/${notification._id}/read`
                                    : `/notifications/${notification._id}/read`;
                                  await axiosInstance.patch(apiPath).catch(() => {});
                                } catch (err) {
                                  console.error("Error marking header notification as read:", err);
                                }
                                try {
                                  navigate(userType === "company" ? "/company/notifications" : "/notifications");
                                } catch (err) {
                                  console.error('Header navigation to notifications failed', err);
                                }
                              }}
                            >
                              <div className="flex items-start space-x-2">
                                <span className={`px-2 py-1 text-xs rounded ${
                                  notification.priority === "urgent" ? "bg-red-100 text-red-800" :
                                  notification.priority === "high" ? "bg-orange-100 text-orange-800" :
                                  notification.priority === "medium" ? "bg-blue-100 text-blue-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {notification.type?.replace(/_/g, " ")}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          ))}
                          <Link
                            to={userType === "company" ? "/company/notifications" : "/notifications"}
                            className="block px-4 py-3 text-center text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => setShowNotifications(false)}
                          >
                            View All
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* User Dropdown */}
              {userType === "user" && (
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="User menu"
                  >
                    <FaUserCircle className="w-5 h-5" />
                    <span className="text-sm font-medium hidden xl:inline">{displayName}</span>
                  </button>
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <FaUser className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/my-jobs"
                        className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <FaListAlt className="w-4 h-4 mr-2" />
                        My Jobs
                      </Link>

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-gray-50"
                      >
                        <FaSignOutAlt className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Login/Register */}
              {userType !== "user" && (
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-md transition-colors font-medium text-sm"
                  aria-label="Login or Register"
                >
                  Login/Register
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-blue-600 focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <FaTimes className="w-6 h-6" />
            ) : (
              <FaBars className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          id="mobile-menu"
          className={`lg:hidden ${isMenuOpen ? "block" : "hidden"} transition-all duration-300 ease-in-out`}
        >
          <div className="pt-4 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
                aria-label={link.aria}
              >
                {link.name}
              </Link>
            ))}
            
            {userType === "user" && (
              <>
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUser className="w-4 h-4 mr-2" />
                  Profile
                </Link>

                <Link
                  to="/chat"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {/* chat icon */}
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
                  Chat
                </Link>
                <Link
                  to="/my-jobs"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaListAlt className="w-4 h-4 mr-2" />
                  My Jobs
                </Link>
                <Link
                  to="/notifications"
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaBell className="w-4 h-4 mr-2" />
                  Notifications
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <span className="ml-auto bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.filter((n) => !n.isRead).length}
                    </span>
                  )}
                </Link>
              </>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleToggleDarkMode}
                className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {darkMode ? (
                  <>
                    <FaSun className="w-4 h-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <FaMoon className="w-4 h-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </button>
              
              {userType === "user" ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors mt-2"
                >
                  <FaSignOutAlt className="w-4 h-4 mr-2" />
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block w-full px-3 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login/Register
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
