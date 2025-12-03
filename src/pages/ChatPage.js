import React, { useEffect, useState } from "react";
import { listConversations } from "../api/chatApi";
import ConversationList from "../components/Chat/ConversationList";
import ChatWindow from "../components/Chat/ChatWindow";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useDarkMode } from "../context/DarkModeContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaComments, FaUserFriends, FaMobileAlt } from "react-icons/fa";

export default function ChatPage() {
  const { user, userType } = useAuth();
  const { darkMode } = useDarkMode();
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

  // Socket is already registered in SocketContext, just add listener
  useEffect(() => {
    if (!socket) return;
    
    console.log('ChatPage: Socket available, adding global listener');
    console.log('ChatPage: Socket ID:', socket.id);
    console.log('ChatPage: Socket connected:', socket.connected);
    
    // Add global listener to see all message:new events
    const globalMessageListener = (payload) => {
      console.log('🔔 ChatPage: Global message:new event received:', payload);
      console.log('🔔 ChatPage: Current user type:', userType);
      console.log('🔔 ChatPage: Payload sender type:', payload?.message?.senderType);
    };
    
    socket.on("message:new", globalMessageListener);
    
    return () => {
      socket.off("message:new", globalMessageListener);
    };
  }, [socket, userType]);

  useEffect(() => {
    (async () => {
      if (!userType) return;
      const items = await listConversations("user");
      setConversations(items);
      // Only set active if the user is a participant
      if (items.length > 0) {
        setActive(items[0]);
      } else {
        setActive(null);
      }
    })();
  }, [userType]);

  // Live update conversation list on new messages

  // Join conversation room when active changes
  useEffect(() => {
    if (!socket || !active?._id) return;
    console.log('ChatPage: Joining conversation room', active._id);
    socket.emit('conversation:join', { conversationId: active._id });
    
    // Listen for confirmation
    const onJoined = ({ conversationId, room }) => {
      console.log('✅ ChatPage: Successfully joined room', { conversationId, room });
    };
    
    socket.on('conversation:joined', onJoined);
    
    return () => {
      socket.off('conversation:joined', onJoined);
    };
  }, [socket, active]);
  useEffect(() => {
    if (!socket) return;
    
    console.log('ChatPage: Setting up conversation list message listener');
    
    const onNew = ({ conversationId, message }) => {
      console.log('ChatPage ConversationList: Received message:new', { conversationId, message });
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === conversationId);
        if (idx === -1) {
          console.log('ChatPage ConversationList: Conversation not found in list');
          return prev;
        }
        const updated = { ...prev[idx] };
        updated.lastMessageAt = message.createdAt || new Date().toISOString();
        updated.lastMessagePreview = message.text || (message.attachments?.[0]?.name || "Attachment");
        // increment unread if not the active convo
        if (!active || active._id !== conversationId) {
          updated.userUnreadCount = (updated.userUnreadCount || 0) + 1;
        }
        const next = [...prev];
        next.splice(idx, 1);
        console.log('ChatPage ConversationList: Updated conversation list');
        return [updated, ...next];
      });
    };
    socket.on("message:new", onNew);
    return () => {
      console.log('ChatPage: Cleaning up conversation list listener');
      socket.off("message:new", onNew);
    };
  }, [socket, active]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((c) => {
    const displayName = userType === "company"
      ? (c.userProfile?.name || c.user?.email || "Candidate")
      : (c.companyProfile?.name || c.company?.email || "Company");
    return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleBackToList = () => {
    setActive(null);
    setShowConversationList(true);
  };

  // If no conversations, show empty state with CTA
  if (conversations.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-md w-full mx-auto text-center p-8">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}> 
            <FaComments className={`text-3xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No conversations yet</h3>
          <p className={`text-lg mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start chatting by visiting the Companies page and clicking "Message" on any company profile.</p>
          <button
            className={`px-6 py-3 rounded-lg font-semibold shadow transition-colors duration-200 ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            onClick={() => window.location.href = '/companies'}
          >
            Browse Companies
          </button>
        </div>
      </div>
    );
  }

  // ...existing code for chat UI...
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
                userType="user"
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
                  userType="user"
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
                  userType="user"
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
                  userType="user"
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
            : 'Start a conversation by visiting a company profile or job posting and clicking "Message"'
          }
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <FaUserFriends />
            <span>Connect with professionals</span>
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


