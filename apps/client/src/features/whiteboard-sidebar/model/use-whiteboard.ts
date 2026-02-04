import { CURSOR_COLORS } from "./whiteboard.constants";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useCollaborationToolStore } from "@entities/collaboration-tool";
import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { SERVER_URL } from "@shared/config";
import { useSync } from "@tldraw/sync";
import type { Editor, TLAsset } from "@tldraw/tldraw";

const getTldrawWebSocketUri = (roomId: string) => {
  const wsUrl = SERVER_URL.replace(/^http/, "ws");
  return `${wsUrl}/tldraw/${encodeURIComponent(roomId)}`;
};

export const useWhiteboard = () => {
  const userId = useUserStore((state) => state.user?.id) || "guest";
  const nickname = useUserStore((state) => state.user?.nickname) || "Guest";
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId) || "default";
  const breakoutState = useBreakoutStore((state) => state.breakoutState);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const myBreakoutRoomId =
    breakoutState?.isActive && userId !== "guest"
      ? (breakoutState.rooms.find((room) => room.userIds.includes(userId))?.roomId ?? null)
      : null;
  const roomId = myBreakoutRoomId || currentRoomId;

  const uri = useMemo(() => getTldrawWebSocketUri(roomId), [roomId]);

  const userInfo = useMemo(
    () => ({
      id: userId,
      name: nickname,
      color: CURSOR_COLORS[Array.from(userId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % CURSOR_COLORS.length],
    }),
    [userId, nickname],
  );

  const handleUpload = useCallback(async (_asset: TLAsset, file: File) => {
    const src = URL.createObjectURL(file);
    objectUrlsRef.current.add(src);
    return { src };
  }, []);

  const assets = useMemo(() => ({ upload: handleUpload }), [handleUpload]);

  const store = useSync({ uri, userInfo, assets });

  const closeTool = useCollaborationToolStore((state) => state.closeTool);

  useEffect(() => {
    const urls = objectUrlsRef.current;

    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const handleMount = (editor: Editor) => {
    editor.selectAll();

    editor.zoomToSelection({
      animation: { duration: 2000 },
    });

    editor.selectNone();
  };

  return {
    store: store.store,
    status: store.status,
    error: store.error,
    closeTool,
    handleMount,
  };
};
