import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import axiosInstance from "../axiosInstance";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const auth = useAuth();
  const user = auth?.user;
  const userType = auth?.userType;

  const heartbeatRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Don't initialize if no user or userType
    if (!user || !user._id || !userType) {
      console.log('SocketContext: No user or userType, skipping socket initialization', { 
        hasUser: !!user, 
        hasUserId: !!user?._id,
        userType 
      });
      // Clean up existing socket if user logged out
      if (socket) {
        console.log('SocketContext: User logged out, disconnecting socket');
        socket.disconnect();
        setSocket(null);
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }
    
    console.log('SocketContext: Initializing socket connection for', { userId: user._id, userType });
    const socketInstance = io(
      process.env.REACT_APP_BACKEND_URL || "http://localhost:5000",
      {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
      }
    );

    socketInstance.on("connect", () => {
      console.log('🔌 SocketContext: Socket connected:', socketInstance.id);
      console.log('🔌 SocketContext: Registering actor:', { id: user._id, type: userType });
      socketInstance.emit("register", { id: user._id, type: userType });
      
      // Listen for registration confirmation
      socketInstance.on("registered", (data) => {
        console.log('✅ SocketContext: Registration confirmed:', data);
      });
      
      // Test: listen for ANY event to verify socket is working
      socketInstance.onAny((eventName, ...args) => {
        console.log(`🔊 SocketContext: Received event "${eventName}"`, args);
      });
      // Schedule a second registration after small delay (defensive)
      reconnectTimeoutRef.current = setTimeout(() => {
        if (socketInstance.connected) {
          console.log('SocketContext: Defensive re-register after connect delay');
          socketInstance.emit("register", { id: user._id, type: userType });
        }
      }, 2000);
      // Start heartbeat to verify server knows this actor is online
      if (!heartbeatRef.current) {
        heartbeatRef.current = setInterval(async () => {
          try {
            // Use correct base path for company vs user
            const basePath = userType === 'company' ? '/company/chat' : '/chat';
            const url = `${basePath}/presence/${userType}/${user._id}`;
            const res = await axiosInstance.get(url);
            if (!res.data?.online) {
              console.warn('SocketContext: Heartbeat detected offline presence; re-registering');
              socketInstance.emit("register", { id: user._id, type: userType });
            }
          } catch (err) {
            console.warn('SocketContext: Heartbeat presence check failed', err?.message || err);
          }
        }, 30000); // every 30s
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("SocketContext: Socket connection error:", error);
    });

    socketInstance.on("reconnect", (attempt) => {
      console.log('SocketContext: Socket reconnected, attempt:', attempt);
      console.log('SocketContext: Re-registering actor:', { id: user._id, type: userType });
      socketInstance.emit("register", { id: user._id, type: userType });
    });

    setSocket(socketInstance);

    return () => {
      console.log('SocketContext: Disconnecting socket');
      socketInstance.disconnect();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [user, userType]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
