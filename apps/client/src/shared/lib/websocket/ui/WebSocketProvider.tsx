import { WebSocketContext } from "../model/use-websocket.ts";
import { Socket, io } from "socket.io-client";

import { type ReactNode, useEffect, useRef, useState } from "react";

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

    const socketInstance = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socketInstance;

    const handleConnect = () => {
      console.log("[WebSocket] Connected:", socketInstance.id);
      setSocket(socketInstance);
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log("[WebSocket] Disconnected:", reason);
      setIsConnected(false);
    };

    const handleConnectError = (err: Error) => {
      console.error("[WebSocket] Connection error:", err.message);
      setIsConnected(false);
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
    };

    const handleReconnect = (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
      setSocket(socketInstance);
      setIsConnected(true);
    };

    const handleReconnectFailed = () => {
      console.error("[WebSocket] Reconnection failed");
      setIsConnected(false);
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.on("reconnect_attempt", handleReconnectAttempt);
    socketInstance.on("reconnect", handleReconnect);
    socketInstance.on("reconnect_failed", handleReconnectFailed);

    return () => {
      if (socketRef.current) {
        console.log("[WebSocket] Cleaning up connection");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return <WebSocketContext.Provider value={{ socket, isConnected }}>{children}</WebSocketContext.Provider>;
};
