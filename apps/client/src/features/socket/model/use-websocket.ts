import { Socket } from "socket.io-client";

import { createContext, useContext } from "react";

export interface WebSocketContextValue {
  readonly socket: Socket | null;
  readonly isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);

  if (context === null) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }

  return context;
};
