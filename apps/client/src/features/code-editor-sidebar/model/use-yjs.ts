import { useEffect, useRef, useState } from "react";

import { useUserStore } from "@entities/user";
import { SERVER_URL } from "@shared/config";

import { getColorForClient } from "./cursor-colors.utils";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

const getYjsWebSocketUrl = (): string => {
  const wsUrl = SERVER_URL.replace(/^http/, "ws");
  return `${wsUrl}/yjs`;
};

export const useYjs = (roomId: string) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<WebsocketProvider["awareness"] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const userNickname = useUserStore((state) => state.user?.nickname);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const sanitizedRoomId = roomId.replace(/[\s()]/g, "-");
    const provider = new WebsocketProvider(getYjsWebSocketUrl(), `code-editor-${sanitizedRoomId}`, ydoc, {
      connect: true,
    });
    providerRef.current = provider;
    awarenessRef.current = provider.awareness;

    const clientColor = getColorForClient(ydoc.clientID);
    provider.awareness.setLocalStateField("user", {
      name: userNickname || "Anonymous",
      color: clientColor.color,
      colorLight: clientColor.light,
    });

    const handleStatus = (event: { status: string }) => {
      setIsConnected(event.status === "connected");
    };

    provider.on("status", handleStatus);
    setTimeout(() => setIsInitialized(true), 0);

    return () => {
      provider.off("status", handleStatus);
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();

      providerRef.current = null;
      ydocRef.current = null;
      awarenessRef.current = null;
      setIsInitialized(false);
      setIsConnected(false);
    };
  }, [roomId, userNickname]);

  return {
    ydocRef,
    providerRef,
    awarenessRef,
    isConnected,
    isInitialized,
  };
};
