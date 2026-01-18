import type * as Monaco from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { useCallback, useEffect, useRef, useState } from "react";

import { useUserStore } from "@entities/user";
import { SERVER_URL } from "@shared/config";

interface UseCollaborativeEditorOptions {
  roomName: string;
}

interface UseCollaborativeEditorReturn {
  handleEditorDidMount: (editor: Monaco.editor.IStandaloneCodeEditor) => void;
  isConnected: boolean;
  connectedUsers: number;
}

const getYjsWebSocketUrl = (): string => {
  const wsUrl = SERVER_URL.replace(/^http/, "ws");
  return `${wsUrl}/yjs`;
};

export const useCollaborativeEditor = ({ roomName }: UseCollaborativeEditorOptions): UseCollaborativeEditorReturn => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);

  const user = useUserStore((state) => state.user);
  const handleEditorDidMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;

      const ytext = ydoc.getText("monaco");

      const sanitizedRoomName = roomName.replace(/[\s()]/g, "-");
      const provider = new WebsocketProvider(getYjsWebSocketUrl(), `code-editor-${sanitizedRoomName}`, ydoc, {
        connect: true,
      });
      providerRef.current = provider;

      provider.awareness.setLocalStateField("user", {
        name: user?.nickname || "Anonymous",
      });

      provider.on("status", (event: { status: string }) => {
        setIsConnected(event.status === "connected");
      });
      provider.awareness.on("change", () => {
        setConnectedUsers(provider.awareness.getStates().size);
      });

      const model = editor.getModel();
      if (model) {
        const binding = new MonacoBinding(ytext, model, new Set([editor]), provider.awareness);
        bindingRef.current = binding;
      }
    },
    [roomName, user?.nickname],
  );

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current.destroy();
        providerRef.current = null;
      }

      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
    };
  }, []);

  return {
    handleEditorDidMount,
    isConnected,
    connectedUsers,
  };
};
