import { getColorForClient } from "./cursor-colors";
import type * as Monaco from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { useCallback, useRef, useState } from "react";

import { useUserStore } from "@entities/user";
import { SERVER_URL } from "@shared/config";

type Awareness = WebsocketProvider["awareness"];

interface UseCollaborativeEditorOptions {
  roomName: string;
}

interface UseCollaborativeEditorReturn {
  handleEditorDidMount: (editor: Monaco.editor.IStandaloneCodeEditor) => void;
  isConnected: boolean;
  isInitialized: boolean;
  editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>;
  awarenessRef: React.RefObject<Awareness | null>;
  ytextRef: React.RefObject<Y.Text | null>;
}

const getYjsWebSocketUrl = (): string => {
  const wsUrl = SERVER_URL.replace(/^http/, "ws");
  return `${wsUrl}/yjs`;
};

export const useCollaborativeEditor = ({ roomName }: UseCollaborativeEditorOptions): UseCollaborativeEditorReturn => {
  const ydocRef = useRef<Y.Doc | null>(null);

  const providerRef = useRef<WebsocketProvider | null>(null);

  const bindingRef = useRef<MonacoBinding | null>(null);

  const initializedRef = useRef(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const awarenessRef = useRef<Awareness | null>(null);

  const ytextRef = useRef<Y.Text | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);

  const user = useUserStore((state) => state.user);

  const cleanup = useCallback(() => {
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

    editorRef.current = null;
    awarenessRef.current = null;
    ytextRef.current = null;

    initializedRef.current = false;
    setIsInitialized(false);
  }, []);

  const handleEditorDidMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      if (initializedRef.current) {
        return;
      }

      cleanup();

      initializedRef.current = true;

      editorRef.current = editor;
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;
      const ytext = ydoc.getText("monaco");

      ytextRef.current = ytext;

      const sanitizedRoomName = roomName.replace(/[\s()]/g, "-");
      const provider = new WebsocketProvider(getYjsWebSocketUrl(), `code-editor-${sanitizedRoomName}`, ydoc, {
        connect: true,
      });
      providerRef.current = provider;

      awarenessRef.current = provider.awareness;

      const clientColor = getColorForClient(ydoc.clientID);
      provider.awareness.setLocalStateField("user", {
        name: user?.nickname || "Anonymous",
        color: clientColor.color,
        colorLight: clientColor.light,
      });

      provider.on("status", (event: { status: string }) => {
        setIsConnected(event.status === "connected");
      });

      const model = editor.getModel();
      if (model) {
        const binding = new MonacoBinding(ytext, model, new Set([editor]), provider.awareness);
        bindingRef.current = binding;
      }
      setIsInitialized(true);

      editor.onDidDispose(() => {
        cleanup();
      });
    },
    [roomName, user?.nickname, cleanup],
  );

  return {
    handleEditorDidMount,
    isConnected,
    isInitialized,
    editorRef,
    awarenessRef,
    ytextRef,
  };
};
