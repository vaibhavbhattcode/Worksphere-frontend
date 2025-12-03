import React, { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTrash,
  FaCheck,
  FaSpinner,
  FaInbox,
  FaFilter,
  FaCalendarAlt,
  FaBriefcase,
  FaUser,
  FaExclamationTriangle
} from "react-icons/fa";
import CompanySidebar from "../../components/Company/CompanySidebar";
import { useSocket } from "../../context/SocketContext";

const CompanyNotificationsPage = () => {
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [deleting, setDeleting] = useState({});
  const [markingRead, setMarkingRead] = useState({});
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/company/notifications");
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      console.log("New notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingRead({ ...markingRead, [notificationId]: true });
      await axiosInstance.patch(`/company/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingRead({ ...markingRead, [notificationId]: false });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.patch("/company/notifications/mark-all-read");
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await axiosInstance.delete("/company/notifications");
      setNotifications([]);
      setShowDeleteAllConfirm(false);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setDeleting({ ...deleting, [notificationId]: true });
      await axiosInstance.delete(`/company/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    } finally {
      setDeleting({ ...deleting, [notificationId]: false });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "application":
        return <FaBriefcase className="text-blue-500" />;
      case "interview":
        return <FaCalendarAlt className="text-purple-500" />;
      case "message":
        return <FaUser className="text-green-500" />;
      case "alert":
        return <FaExclamationTriangle className="text-yellow-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "read") return notif.isRead;
    return true;
  });

  // Utility to format date as DD/MM/YYYY
  function formatDateDMY(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date)) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDateDMY(date);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <CompanySidebar />

      <div className="flex-1 md:ml-80 p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <FaBell className="text-white text-xl" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600">Stay updated with your latest activities</p>
                </div>
              </div>

              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <FaCheck />
                    <span>Mark All Read</span>
                  </motion.button>
                )}
                {notifications.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                  >
                    <FaTrash />
                    <span>Delete All</span>
                  </motion.button>
                )}
              </div>
                  {/* Delete All Confirmation Modal */}
                  {showDeleteAllConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
                        <h2 className="text-xl font-bold mb-4">Delete All Notifications?</h2>
                        <p className="mb-6 text-gray-700">Are you sure you want to delete all notifications? This action cannot be undone.</p>
                        <div className="flex gap-4 justify-center">
                          <button
                            onClick={() => setShowDeleteAllConfirm(false)}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                            disabled={deletingAll}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAll}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            disabled={deletingAll}
                          >
                            {deletingAll ? <FaSpinner className="inline animate-spin mr-2" /> : <FaTrash className="inline mr-2" />} Delete All
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
              {["all", "unread", "read"].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    filter === filterType
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  {filterType === "unread" && notifications.filter((n) => !n.isRead).length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {notifications.filter((n) => !n.isRead).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FaSpinner className="text-5xl text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaInbox className="text-5xl text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">
                {filter === "unread"
                  ? "You're all caught up! No unread notifications."
                  : filter === "read"
                  ? "No read notifications yet."
                  : "You don't have any notifications yet."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${
                      !notification.isRead ? "border-l-4 border-blue-500" : ""
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <motion.div
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 10 }}
                        >
                          {getNotificationIcon(notification.type)}
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatTimestamp(notification.createdAt)}
                              </span>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-3">{notification.message}</p>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMarkAsRead(notification._id)}
                                disabled={markingRead[notification._id]}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                {markingRead[notification._id] ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaCheck />
                                )}
                                Mark as Read
                              </motion.button>
                            )}

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(notification._id)}
                              disabled={deleting[notification._id]}
                              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {deleting[notification._id] ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaTrash />
                              )}
                              Delete
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CompanyNotificationsPage;
