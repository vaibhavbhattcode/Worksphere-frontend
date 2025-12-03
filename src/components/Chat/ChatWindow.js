import React, { useEffect, useRef, useState, useMemo } from "react";
import { listMessages, sendMessage, markRead, sendAttachment } from "../../api/chatApi";
import { useSocket } from "../../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaPaperclip,
  FaPaperPlane,
  FaCheck,
  FaCheckDouble,
  FaImage,
  FaFile,
  FaDownload,
  FaSmile,
  FaMicrophone,
  FaStop,
  FaPlay,
  FaPause
} from "react-icons/fa";

function formatMessageTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch { return ""; }
}

function MessageBubble({ message, isOwn, darkMode, userType }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOwnMessage = message.senderType === (userType === "company" ? "company" : "user");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Message Content */}
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isOwnMessage
            ? darkMode
              ? 'bg-blue-600 text-white'
              : 'bg-blue-500 text-white'
            : darkMode
              ? 'bg-gray-700 text-gray-100'
              : 'bg-white text-gray-900 border border-gray-200'
        }`}>

          {/* Attachments */}
          {Array.isArray(message.attachments) && message.attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.attachments.map((att, idx) => {
                const fullUrl = att.url?.startsWith('http')
                  ? att.url
                  : `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}${att.url}`;

                if (att.type === "image") {
                  return (
                    <div key={idx} className="relative">
                      {!imageLoaded && !imageError && (
                        <div className={`w-full h-32 rounded-lg flex items-center justify-center ${
                          darkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
                        </div>
                      )}
                      {imageError ? (
                        <div className={`w-full h-32 rounded-lg flex items-center justify-center ${
                          darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          <FaImage className="text-2xl mb-1" />
                          <span className="text-sm">Failed to load image</span>
                        </div>
                      ) : (
                        <img
                          src={fullUrl}
                          alt={att.name || "attachment"}
                          className={`rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                            imageLoaded ? 'block' : 'hidden'
                          }`}
                          onLoad={() => setImageLoaded(true)}
                          onError={() => setImageError(true)}
                          onClick={() => window.open(fullUrl, '_blank')}
                        />
                      )}
                    </div>
                  );
                } else {
                  return (
                    <a
                      key={idx}
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isOwnMessage
                          ? 'bg-blue-700/50 hover:bg-blue-700/70'
                          : darkMode
                            ? 'bg-gray-600 hover:bg-gray-500'
                            : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <FaFile className={`text-lg ${isOwnMessage ? 'text-blue-200' : 'text-blue-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${
                          isOwnMessage ? 'text-blue-100' : darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {att.name || 'Download file'}
                        </div>
                        <div className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                          Click to download
                        </div>
                      </div>
                      <FaDownload className={`text-sm ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`} />
                    </a>
                  );
                }
              })}
            </div>
          )}

          {/* Message Text */}
          {message.text && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.text}
            </div>
          )}

          {/* Message Footer */}
          <div className={`flex items-center justify-end mt-2 space-x-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span className="text-xs opacity-75">
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwnMessage && (
              <div className="flex items-center ml-1">
                {message.readAt ? (
                  <FaCheckDouble className="text-xs text-blue-200" />
                ) : (
                  <FaCheck className="text-xs opacity-75" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatWindow({ userType, conversation, darkMode, onBack, isMobile }) {
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCounterpartyOnline, setIsCounterpartyOnline] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const { socket } = useSocket();
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingEmitTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const msgId = (m) => String(m?._id || m?.id || "");
  const upsertMessage = (prev, newMsg) => {
    const id = msgId(newMsg);
    if (!id) return prev;
    const idx = prev.findIndex((m) => msgId(m) === id);
    if (idx === -1) return [...prev, newMsg];
    const next = [...prev];
    next[idx] = { ...prev[idx], ...newMsg };
    return next;
  };
  const dedupeMessages = (arr) => {
    const seen = new Set();
    const out = [];
    for (const m of arr) {
      const id = msgId(m);
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(m);
    }
    return out;
  };
  const uniqueMessages = useMemo(() => dedupeMessages(messages), [messages]);

  // Track counterparty online status
  useEffect(() => {
    if (!socket || !conversation) return;

    // Set initial online status from conversation data
    setIsCounterpartyOnline(conversation.isOnline || false);

    const counterpartyType = userType === "company" ? "user" : "company";
    const counterpartyId = userType === "company" 
      ? String(conversation.user?._id || conversation.user)
      : String(conversation.company?._id || conversation.company);

    const handleUserOnline = ({ type, id, isOnline }) => {
      if (type === counterpartyType && String(id) === counterpartyId) {
        setIsCounterpartyOnline(true);
      }
    };

    const handleUserOffline = ({ type, id, isOnline }) => {
      if (type === counterpartyType && String(id) === counterpartyId) {
        setIsCounterpartyOnline(false);
      }
    };

    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    return () => {
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
    };
  }, [socket, conversation, userType]);

  useEffect(() => {
    if (!conversation) return;
    (async () => {
      try {
        const data = await listMessages(userType, conversation._id);
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
        setForbidden(false);
        await markRead(userType, conversation._id);
      } catch (err) {
        if (err?.response?.status === 403) {
          setForbidden(true);
        } else {
          setForbidden(false);
        }
      }
    })();
  }, [conversation, userType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket || !conversation) {
      console.log('ChatWindow: No socket or conversation', { hasSocket: !!socket, hasConversation: !!conversation });
      return;
    }
    
    console.log('🎯 ChatWindow: Setting up socket listeners for conversation:', conversation._id);
    console.log('🎯 ChatWindow: UserType:', userType);
    console.log('🎯 ChatWindow: Socket ID:', socket.id);
    console.log('🎯 ChatWindow: Socket connected:', socket.connected);
    
    const onNew = (payload) => {
      console.log('=== 💬 ChatWindow: Received message:new event ===');
      console.log('💬 Payload:', JSON.stringify(payload, null, 2));
      console.log('💬 Current conversation ID:', conversation._id);
      console.log('💬 Payload conversation ID:', payload.conversationId);
      console.log('💬 Message sender type:', payload?.message?.senderType);
      console.log('💬 Current userType:', userType);
      console.log('💬 IDs match (strict):', payload.conversationId === conversation._id);
      console.log('💬 IDs match (string):', String(payload.conversationId) === String(conversation._id));
      
      if (payload.conversationId === conversation._id || String(payload.conversationId) === String(conversation._id)) {
        console.log('✅ ChatWindow: Message is for current conversation, adding to messages');
        setMessages((prev) => {
          // Avoid duplicate messages
          const messageId = payload.message._id || payload.message.id;
          if (!messageId) {
            console.log('⚠️  ChatWindow: Message has no ID, skipping');
            return prev;
          }
          
          const exists = prev.some((m) => String(m._id) === String(messageId) || String(m.id) === String(messageId));
          if (exists) {
            console.log('⚠️  ChatWindow: Message already in list, skipping');
            return prev;
          }
          
          console.log('✅ ChatWindow: Adding new message to list');
          return upsertMessage(prev, payload.message);
        });
      } else {
        console.log('❌ ChatWindow: Message is for different conversation, ignoring');
      }
    };
    
    const onRead = (payload) => {
      console.log('ChatWindow: Received message:read event', payload);
      if (payload.conversationId === conversation._id || String(payload.conversationId) === String(conversation._id)) {
        setMessages((prev) => prev.map((m) => ({ ...m, readAt: m.readAt || new Date().toISOString() })));
      }
    };
    
    const onTyping = (payload) => {
      console.log('ChatWindow: Received typing event', payload);
      console.log('ChatWindow: Current conversation ID:', conversation._id);
      console.log('ChatWindow: Payload conversation ID:', payload.conversationId);
      console.log('ChatWindow: IDs match:', payload.conversationId === conversation._id || String(payload.conversationId) === String(conversation._id));
      
      if (payload.conversationId === conversation._id || String(payload.conversationId) === String(conversation._id)) {
        console.log('✅ ChatWindow: Showing typing indicator');
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          console.log('ChatWindow: Hiding typing indicator after timeout');
          setIsTyping(false);
        }, 3000); // Increased to 3 seconds for better visibility
      } else {
        console.log('❌ ChatWindow: Typing event for different conversation, ignoring');
      }
    };
    
    socket.on("message:new", onNew);
    socket.on("message:read", onRead);
    socket.on("typing", onTyping);
    
    return () => {
      console.log('ChatWindow: Cleaning up socket listeners');
      socket.off("message:new", onNew);
      socket.off("message:read", onRead);
      socket.off("typing", onTyping);
    };
  }, [socket, conversation?._id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    // Optimistic add
    const tempId = `local-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      senderType: userType,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => upsertMessage(prev, optimistic));
    setText("");
    try {
      const msg = await sendMessage(userType, conversation._id, optimistic.text);
      console.log('ChatWindow: Message sent, replacing optimistic with real message', { tempId, realId: msg._id });
      setMessages((prev) => {
        // Replace optimistic message with real one
        const withReal = prev.map((m) => (m._id === tempId ? { ...msg } : m));
        return upsertMessage(withReal, msg);
      });
    } catch (e) {
      // Rollback on error
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      alert("Failed to send message. Please try again.");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large (max 10MB)");
      return;
    }
    const msg = await sendAttachment(userType, conversation._id, file);
    setMessages((prev) => upsertMessage(prev, msg));
    e.target.value = "";
  };

  const emitTyping = () => {
    if (!socket || !conversation) return;
    
    // Clear previous timeout
    if (typingEmitTimeoutRef.current) {
      clearTimeout(typingEmitTimeoutRef.current);
    }
    
    // Debounce typing emission to avoid flooding server
    typingEmitTimeoutRef.current = setTimeout(() => {
      const to = userType === "company" 
        ? { type: "user", id: conversation.user } 
        : { type: "company", id: conversation.company };
      socket.emit("typing", { conversationId: conversation._id, to });
      console.log('ChatWindow: Emitted typing event', { conversationId: conversation._id, to });
    }, 300); // Wait 300ms after last keystroke
  };

  const handleEmojiClick = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
  };

  const displayName = userType === "company"
    ? (conversation.userProfile?.name || conversation.user?.email || "Candidate")
    : (conversation.companyProfile?.name || conversation.company?.email || "Company");

  const avatar = userType === "company"
    ? (conversation.userProfile?.profileImage || "")
    : (conversation.companyProfile?.logo || "");


  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-5xl mb-4 text-red-500">&#9888;</div>
        <h2 className="text-xl font-bold mb-2">Access Forbidden</h2>
        <p className="mb-4 text-gray-500">You are not a participant in this conversation or do not have permission to view it.</p>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => window.location.href = '/chat'}
        >
          Back to My Chats
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Chat Header */}
      <div className={`flex items-center justify-between p-4 border-b transition-colors duration-300 ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        {isMobile && (
          <button
            onClick={onBack}
            className={`p-2 rounded-lg transition-colors duration-200 mr-3 ${
              darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <FaArrowLeft />
          </button>
        )}

        <div className="flex items-center flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
              {avatar ? (
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center font-semibold ${
                  darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
              darkMode ? 'border-gray-800' : 'border-white'
            } ${isCounterpartyOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
              {isCounterpartyOnline && (
                <div className="w-full h-full rounded-full bg-green-500 animate-pulse"></div>
              )}
            </div>
          </div>

          <div className="ml-3 flex-1 min-w-0">
            <h3 className={`font-semibold text-lg truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {displayName}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isCounterpartyOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence>
          {uniqueMessages.map((m) => (
            <MessageBubble
              key={m._id}
              message={m}
              isOwn={m.senderType === (userType === "company" ? "company" : "user")}
              darkMode={darkMode}
              userType={userType}
            />
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex justify-start mb-2"
            >
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                darkMode ? 'bg-gray-700/80' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${
                        darkMode ? 'bg-blue-400' : 'bg-blue-500'
                      }`}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${
                        darkMode ? 'bg-blue-400' : 'bg-blue-500'
                      }`}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                    />
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${
                        darkMode ? 'bg-blue-400' : 'bg-blue-500'
                      }`}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {displayName} is typing...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t transition-colors duration-300 ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <form onSubmit={handleSend} className="flex items-end gap-3">
          {/* File Attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-full transition-colors duration-200 ${
              darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaPaperclip />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                emitTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className={`w-full px-4 py-3 pr-12 rounded-2xl border resize-none transition-colors duration-200 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors duration-200 ${
                darkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaSmile />
            </button>
          </div>

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!text.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-full transition-all duration-200 ${
              text.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                : darkMode
                  ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FaPaperPlane className="text-lg" />
          </motion.button>
        </form>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Emoji Picker (placeholder for now) */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute bottom-20 left-4 right-4 p-4 rounded-2xl shadow-xl border ${
                darkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="grid grid-cols-8 gap-2">
                {['😀', '😂', '❤️', '👍', '👎', '👋', '🔥', '⭐'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:scale-125 transition-transform duration-200"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

