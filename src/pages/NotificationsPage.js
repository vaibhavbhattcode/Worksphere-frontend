import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaCheckCircle,
  FaBriefcase,
  FaCheck,
  FaClock,
  FaBell,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

// Utility to format date as DD/MM/YYYY
function formatDateDMY(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date)) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/notifications");
      // normalize jobId in notifications to simple id when possible
      const normalized = (res.data || []).map(n => {
        const job = n.data?.jobId;
        const jobId = job && typeof job === 'object' ? (job._id || job.id) : job;
        return { ...n, data: { ...n.data, jobId } };
      });
      setNotifications(normalized);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
    }
  }, [user]);

  // Handle real-time notifications
  useEffect(() => {
    if (!socket || !user?._id) return;

    socket.emit("register", user._id);
    console.log("Socket registered user:", user._id);

    socket.on("notification", (notification) => {
      console.log("Received notification:", notification);
      const normalized = { ...notification, data: { ...notification.data, jobId: notification.data?.jobId?._id || notification.data?.jobId } };
      setNotifications((prev) => {
        if (prev.some((n) => n._id === normalized._id)) {
          console.log("Duplicate notification ignored:", normalized._id);
          return prev;
        }
        return [normalized, ...prev];
      });
    });

    socket.on("notificationDeleted", (id) => {
      console.log("Notification deleted:", id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    });

    socket.on("notificationsCleared", () => {
      console.log("All notifications cleared");
      setNotifications([]);
    });

    socket.on("notificationsMarkedRead", () => {
      console.log("All notifications marked as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });

    return () => {
      socket.off("notification");
      socket.off("notificationDeleted");
      socket.off("notificationsCleared");
      socket.off("notificationsMarkedRead");
      console.log("Socket listeners removed");
    };
  }, [socket, user]);

  const markAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read first
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Direct navigation for new job postings -> go to job page
    if (notification.type === "new_job_posted" && notification.data?.jobId) {
      navigate(`/job/${notification.data.jobId}`);
      return;
    }

    // For application/interview related notifications, show an inline professional message
    const messageTypes = [
      "application_accepted",
      "application_rejected",
      "interview_scheduled",
      "interview_reminder",
    ];

    if (messageTypes.includes(notification.type)) {
      // toggle expanded panel
      setExpandedId((prev) => (prev === notification._id ? null : notification._id));
      return;
    }

    // Otherwise navigate based on notification data
    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
    } else if (notification.data?.jobId) {
      navigate(`/job/${notification.data.jobId}`);
    } else if (notification.data?.conversationId) {
      navigate("/chat");
    } else if (notification.job) {
      // Fallback for old notifications
      navigate(`/job/${notification.job._id || notification.job}`);
    }
  };

  // Build a professional message based on type and available data
  const getMessageForNotification = (n) => {
    // Normalize jobTitle: accept string or object with common fields
    let jobTitleRaw = n.data?.jobTitle ?? n.data?.job ?? n.job?.title ?? (n.data?.jobId && `the job`);
    let jobTitle = "";
    if (!jobTitleRaw) jobTitle = "";
    else if (typeof jobTitleRaw === "string") jobTitle = jobTitleRaw;
    else if (typeof jobTitleRaw === "object") jobTitle = jobTitleRaw.title || jobTitleRaw.jobTitle || jobTitleRaw.name || "the job";

    // Normalize company: accept string or object with common fields
    let companyRaw = n.data?.companyName ?? n.data?.company ?? n.data?.companyId;
    let company = "";
    if (!companyRaw) company = "";
    else if (typeof companyRaw === "string") company = companyRaw;
    else if (typeof companyRaw === "object") company = companyRaw.name || companyRaw.companyName || companyRaw.contactName || "";

    // Helper: avoid showing raw Mongo IDs like '68d6e28f...'
    const isLikelyObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
    if (isLikelyObjectId(company)) company = "";

    switch (n.type) {
      case "application_accepted":
        return `Congratulations! Your application${jobTitle ? ` for ${jobTitle}` : ""} has been accepted. Please contact ${company || "the company"} for next steps and more details.`;
      case "application_rejected":
        return `We're sorry to let you know that your application${jobTitle ? ` for ${jobTitle}` : ""} was not successful. Keep applying — better opportunities are ahead.`;
      case "interview_scheduled":
        return `An interview has been scheduled${jobTitle ? ` for ${jobTitle}` : ""}. Please check your email for the invitation and joining link. If you need details, contact ${company || "the employer"}.`;
      case "interview_reminder":
        return `This is a reminder${jobTitle ? ` for your interview for ${jobTitle}` : ""}. Please check your email for the joining link and instructions.`;
      default:
        return n.message || "See details in your notifications.";
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/notifications`, { data: { id } });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAll = async () => {
    try {
      await axiosInstance.delete("/notifications");
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  // Apply filter and sort to notifications for rendering
  const visibleNotifications = (() => {
    let list = Array.isArray(notifications) ? [...notifications] : [];
    if (filterType === "applications") {
      list = list.filter((x) => (x.type || "").startsWith("application"));
    } else if (filterType === "interviews") {
      list = list.filter((x) => (x.type || "").includes("interview"));
    } else if (filterType === "messages") {
      list = list.filter((x) => (x.type || "").includes("message"));
    }
    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? tb - ta : ta - tb;
    });
    return list;
  })();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="w-full bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaBell className="text-blue-600 dark:text-blue-400" />{" "}
            Notifications
          </h2>
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm shadow"
            >
              Mark All as Read
            </button>
            <button
              onClick={clearAll}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm shadow"
            >
              Clear All
            </button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
        ) : visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FaBell className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">You have no notifications yet.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Filter:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">All</option>
                  <option value="applications">Applications</option>
                  <option value="interviews">Interviews</option>
                  <option value="messages">Messages</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Sort:</label>
                <button
                  onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                  title="Toggle sort order"
                >
                  {sortOrder === "desc" ? "Newest" : "Oldest"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {visibleNotifications.map((n) => (
                <React.Fragment key={n._id}>
                  <div
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start justify-between p-5 border rounded-xl shadow transition-all duration-200 cursor-pointer hover:shadow-xl ${
                      n.isRead
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "bg-white dark:bg-gray-900 border-blue-100 dark:border-blue-900 shadow-lg"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${
                          n.priority === "urgent" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                          n.priority === "high" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" :
                          n.priority === "medium" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                        }`}> 
                          {n.type?.replace(/_/g, " ")}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 font-semibold text-base mb-1">{n.title || "Notification"}</p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{n.message}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                        <FaClock className="text-xs" />
                        {(() => {
                          const date = new Date(n.createdAt);
                          const now = new Date();
                          const diff = now - date;
                          const days = Math.floor(diff / 86400000);
                          if (days < 7) {
                            return formatDistanceToNow(date, { addSuffix: true });
                          } else {
                            return formatDateDMY(date);
                          }
                        })()}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2 ml-4">
                      {n.isRead && (
                        <span className="text-green-500 text-xs font-semibold flex items-center gap-1" title="Read">
                          <FaCheck className="text-sm" /> Read
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n._id);
                        }}
                        className="text-red-600 hover:text-red-700 dark:hover:text-red-400 p-2"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                      {n.data?.jobId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/job/${n.data.jobId}`);
                          }}
                          className="bg-blue-600 text-white text-xs px-3 py-1 rounded"
                          title="View Job"
                        >
                          View Job
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedId === n._id && (
                    <div key={n._id + "_exp"} className="mt-3 w-full px-5">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 border rounded">
                        <p className="text-gray-800 dark:text-gray-100">{getMessageForNotification(n)}</p>
                        <div className="mt-3 flex gap-2">
                          {n.data?.actionUrl && (
                            <a href={n.data.actionUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Open details</a>
                          )}
                          {n.data?.companyContact && (
                            <span className="text-sm text-green-600">Contact: {n.data.companyContact}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </main>
      {/* Footer */}
      <footer className="w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-gray-400 dark:text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} WorkSphere. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default NotificationsPage;
