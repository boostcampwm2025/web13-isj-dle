import { Socket } from "socket.io-client";

import { createContext, useContext } from "react";

export interface WebSocketContextValue {
  readonly socket: Socket | null;
  readonly isConnected: boolean;
  readonly setGame: (game: Phaser.Game | null) => void;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);

  if (context === null) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }

  return context;
};
