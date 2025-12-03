import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaCircle, FaArrowLeft, FaUser, FaBuilding } from "react-icons/fa";
import { useSocket } from "../../context/SocketContext";

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;

    // Today
    if (diff < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Yesterday
    if (diff < 48 * 60 * 60 * 1000 && d.getDate() === now.getDate() - 1) {
      return "Yesterday";
    }
    // This week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }
    // Older
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch { return ""; }
}

function formatLastMessageTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;

    if (diff < 60 * 1000) return "now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch { return ""; }
}

export default function ConversationList({
  userType,
  conversations,
  activeId,
  onSelect,
  searchTerm,
  onSearchChange,
  darkMode,
  isMobile = false
}) {
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const { socket } = useSocket();

  // Real-time online status tracking via socket
  useEffect(() => {
    if (!socket) return;

    // Initialize online status from conversation data
    const initialOnline = new Map();
    conversations.forEach((c) => {
      const counterpartyId = userType === "company" 
        ? String(c.user?._id || c.user)
        : String(c.company?._id || c.company);
      initialOnline.set(counterpartyId, c.isOnline || false);
    });
    setOnlineUsers(initialOnline);

    // Determine what type of counterparty we're tracking
    const counterpartyType = userType === "company" ? "user" : "company";

    console.log(`ConversationList: Tracking online status for ${counterpartyType}s`);

    // Listen for online status changes - ONLY for the counterparty type
    const handleUserOnline = ({ type, id, isOnline }) => {
      console.log(`ConversationList: Received user:online event`, { type, id, counterpartyType });
      // Only update if this is the type we care about (user tracking companies, company tracking users)
      if (type === counterpartyType) {
        console.log(`✅ ConversationList: ${type} ${id} is now ONLINE`);
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.set(String(id), true);
          return updated;
        });
      } else {
        console.log(`❌ ConversationList: Ignoring ${type} ${id} (we track ${counterpartyType})`);
      }
    };

    const handleUserOffline = ({ type, id, isOnline }) => {
      console.log(`ConversationList: Received user:offline event`, { type, id, counterpartyType });
      // Only update if this is the type we care about
      if (type === counterpartyType) {
        console.log(`✅ ConversationList: ${type} ${id} is now OFFLINE`);
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.set(String(id), false);
          return updated;
        });
      } else {
        console.log(`❌ ConversationList: Ignoring ${type} ${id} (we track ${counterpartyType})`);
      }
    };

    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    return () => {
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
    };
  }, [socket, conversations, userType]);

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b transition-colors duration-300 ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}>
        {isMobile && (
          <div className="flex items-center mb-3">
            <button
              onClick={() => window.history.back()}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <h2 className={`text-xl font-bold ml-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Messages
            </h2>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors duration-200 text-sm ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <FaUser className={`text-2xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No conversations yet
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Start connecting with professionals to begin chatting
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((c, index) => {
              const displayName = userType === "company"
                ? (c.userProfile?.name || c.user?.email || "Candidate")
                : (c.companyProfile?.name || c.company?.email || "Company");
              const avatar = userType === "company"
                ? (c.userProfile?.profileImage || "")
                : (c.companyProfile?.logo || "");
              const unread = userType === "company"
                ? (c.companyUnreadCount || 0)
                : (c.userUnreadCount || 0);
              
              // Get counterparty ID and check online status
              const counterpartyId = userType === "company"
                ? String(c.user?._id || c.user)
                : String(c.company?._id || c.company);
              const isOnline = onlineUsers.get(counterpartyId) || false;
              const isActive = activeId === c._id;

              return (
                <motion.button
                  key={c._id}
                  onClick={() => onSelect(c)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-full text-left px-4 py-3 transition-all duration-200 hover:shadow-sm ${
                    isActive
                      ? darkMode
                        ? 'bg-blue-900/30 border-r-2 border-blue-500'
                        : 'bg-blue-50 border-r-2 border-blue-500'
                      : darkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Online Status */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-lg font-semibold ${
                            darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {userType === "company" ? <FaUser /> : <FaBuilding />}
                          </div>
                        )}
                      </div>
                      {/* Online Status Indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 ${
                        darkMode ? 'border-gray-800' : 'border-white'
                      } ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <div className={`w-full h-full rounded-full ${
                          isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`}></div>
                      </div>
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold text-sm truncate ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {displayName}
                        </h3>
                        <span className={`text-xs flex-shrink-0 ml-2 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatLastMessageTime(c.lastMessageAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate flex-1 mr-2 ${
                          unread > 0
                            ? darkMode ? 'text-gray-200 font-medium' : 'text-gray-900 font-medium'
                            : darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {c.lastMessagePreview || "No messages yet"}
                        </p>

                        {/* Unread Badge */}
                        {unread > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0"
                          >
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className={`px-4 py-3 border-t transition-colors duration-300 ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

