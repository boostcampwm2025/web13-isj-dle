import { requestLivekitToken } from "../api/livekit.api";

import { useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import type { LivekitRoomConfig } from "@shared/types";

interface UseLivekitState {
  token: string | null;
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
}

export const useLivekit = (): UseLivekitState => {
  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);
  const [config, setConfig] = useState<LivekitRoomConfig | null>(null);
  const roomId = user?.avatar.currentRoomId;
  const userId = user?.id;
  const nickname = user?.nickname;

  const currentUserFromList = users.find((u) => u.id === userId);
  const contactId = currentUserFromList?.contactId ?? user?.contactId;

  const [livekitState, setLivekitState] = useState<UseLivekitState>({
    token: null,
    serverUrl: null,
    isLoading: false,
    error: null,
    isOpen: false,
  });

  useEffect(() => {
    if (!roomId || !userId || !nickname) return;

    setConfig({
      roomId: getEffectiveRoomId(roomId, contactId),
      userId,
      nickname,
    });

    if (roomId === "lobby" || roomId === "desk zone") {
      setLivekitState((prev) => ({ ...prev, isOpen: !!contactId }));
    } else if (roomId.startsWith("meeting (") && roomId.includes("-")) {
      setLivekitState((prev) => ({ ...prev, isOpen: false }));
    } else {
      setLivekitState((prev) => ({ ...prev, isOpen: true }));
    }
  }, [roomId, userId, nickname, contactId]);

  useEffect(() => {
    if (!config) return;
    const controller = new AbortController();

    (async () => {
      setLivekitState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (!livekitState.isOpen) {
          throw new Error("Livekit room is not open");
        }

        const data = await requestLivekitToken(config, controller.signal);

        setLivekitState((prev) => ({ ...prev, token: data.token, serverUrl: data.url, isLoading: false, error: null }));
      } catch (error) {
        if (controller.signal.aborted) return;

        setLivekitState((prev) => ({
          ...prev,
          token: null,
          serverUrl: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    })();

    return () => controller.abort();
  }, [config, livekitState.isOpen]);

  return livekitState;
};

export const getEffectiveRoomId = (roomId: string, contactId: string | null | undefined): string => {
  if ((roomId === "lobby" || roomId === "desk zone") && contactId) {
    return contactId;
  }
  return roomId;
};
