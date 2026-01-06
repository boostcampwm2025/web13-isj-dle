import { Socket } from "socket.io-client";

import { createContext } from "react";

export interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null);
