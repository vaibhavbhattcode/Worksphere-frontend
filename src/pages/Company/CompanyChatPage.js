import React, { useEffect, useState } from "react";
import { listConversations } from "../../api/chatApi";
import ConversationList from "../../components/Chat/ConversationList";
import ChatWindow from "../../components/Chat/ChatWindow";
import axiosInstance from "../../axiosInstance";
import { useSocket } from "../../context/SocketContext";
import { useDarkMode } from "../../context/DarkModeContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaComments, FaUserFriends, FaMobileAlt } from "react-icons/fa";

export default function CompanyChatPage() {
  const { darkMode } = useDarkMode();
  const [company, setCompany] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const { socket } = useSocket();

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowConversationList(!active);
      } else {
        setShowConversationList(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [active]);

  useEffect(() => {
    (async () => {
      try {
  const res = await axiosInstance.get("/company/auth/status");
        if (res.data.loggedIn && res.data.type === "company") {
          setCompany(res.data.company);
        }
      } catch {}
    })();
  }, []);

  // Socket is already registered in SocketContext, just add listener
  useEffect(() => {
    if (!socket) return;
    
    console.log('CompanyChatPage: Socket available, adding global listener');
    
    // Add global listener to see all message:new events
    const globalMessageListener = (payload) => {
      console.log('CompanyChatPage: Global message:new event received:', payload);
    };
    
    socket.on("message:new", globalMessageListener);
    
    return () => {
      socket.off("message:new", globalMessageListener);
    };
  }, [socket]);

  useEffect(() => {
    (async () => {
      const items = await listConversations("company");
      setConversations(items);
      setActive(items[0] || null);
    })();
  }, [company]);

  // Join conversation room when active changes
  useEffect(() => {
    if (!socket || !active?._id) return;
    console.log('CompanyChatPage: Joining conversation room', active._id);
    socket.emit('conversation:join', { conversationId: active._id });
    
    // Listen for confirmation
    const onJoined = ({ conversationId, room }) => {
      console.log('✅ CompanyChatPage: Successfully joined room', { conversationId, room });
    };
    
    socket.on('conversation:joined', onJoined);
    
    return () => {
      socket.off('conversation:joined', onJoined);
    };
  }, [socket, active]);

  useEffect(() => {
    if (!socket) return;
    
    console.log('CompanyChatPage: Setting up conversation list message listener');
    
    const onNew = ({ conversationId, message }) => {
      console.log('CompanyChatPage ConversationList: Received message:new', { conversationId, message });
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === conversationId);
        if (idx === -1) {
          console.log('CompanyChatPage ConversationList: Conversation not found in list');
          return prev;
        }
        const updated = { ...prev[idx] };
        updated.lastMessageAt = message.createdAt || new Date().toISOString();
        updated.lastMessagePreview = message.text || (message.attachments?.[0]?.name || "Attachment");
        if (!active || active._id !== conversationId) {
          updated.companyUnreadCount = (updated.companyUnreadCount || 0) + 1;
        }
        const next = [...prev];
        next.splice(idx, 1);
        console.log('CompanyChatPage ConversationList: Updated conversation list');
        return [updated, ...next];
      });
    };
    socket.on("message:new", onNew);
    return () => {
      console.log('CompanyChatPage: Cleaning up conversation list listener');
      socket.off("message:new", onNew);
    };
  }, [socket, active]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((c) => {
    const displayName = c.userProfile?.name || c.user?.email || "Candidate";
    return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleBackToList = () => {
    setActive(null);
    setShowConversationList(true);
  };

  return (
    <div className={`flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`} style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
      <div className="flex flex-1 overflow-hidden">
      {/* Desktop Layout */}
      {!isMobile && (
        <>
          {/* Conversation List Sidebar */}
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`w-80 border-r transition-colors duration-300 ${
              darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            }`}
          >
            <ConversationList
              userType="company"
              conversations={filteredConversations}
              activeId={active?._id}
              onSelect={setActive}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              darkMode={darkMode}
            />
          </motion.div>

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1"
          >
            {active ? (
              <ChatWindow
                userType="company"
                conversation={active}
                darkMode={darkMode}
                onBack={handleBackToList}
                isMobile={false}
              />
            ) : (
              <EmptyState darkMode={darkMode} hasConversations={conversations.length > 0} />
            )}
          </motion.div>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <AnimatePresence mode="wait">
          {showConversationList ? (
            <motion.div
              key="conversation-list"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className={`w-full border-r transition-colors duration-300 ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}
            >
              <ConversationList
                userType="company"
                conversations={filteredConversations}
                activeId={active?._id}
                onSelect={(conversation) => {
                  setActive(conversation);
                  setShowConversationList(false);
                }}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                darkMode={darkMode}
                isMobile={true}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat-window"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-full"
            >
              <ChatWindow
                userType="company"
                conversation={active}
                darkMode={darkMode}
                onBack={handleBackToList}
                isMobile={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ darkMode, hasConversations }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md mx-auto px-6"
      >
        <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
          darkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <FaComments className={`text-3xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {hasConversations ? 'No conversation selected' : 'No conversations yet'}
        </h3>
        <p className={`text-lg mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {hasConversations 
            ? 'Choose a conversation from the sidebar to start messaging'
            : 'Start conversations with candidates from the Applications page'
          }
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <FaUserFriends />
            <span>Connect with candidates</span>
          </div>
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <FaMobileAlt />
            <span>Mobile friendly</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


