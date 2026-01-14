import { useEffect, useState } from "react";

import { requestLivekitToken } from "@features/video-conference/api/livekit.api";
import type { LivekitRoomConfig } from "@shared/types";
import { useUser } from "@src/entities/user";

interface UseLivekitState {
  token: string | null;
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
}

export const useLivekit = (): UseLivekitState => {
  const { user, users } = useUser();
  const [config, setConfig] = useState<LivekitRoomConfig | null>(null);
  const roomId = user?.avatar.currentRoomId;
  const userId = user?.id;
  const nickname = user?.nickname;

  // users 배열에서 현재 유저의 최신 contactId 가져오기
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

    // lobby는 contactId가 있을 때만 연결
    if (roomId === "lobby") {
      setLivekitState((prev) => ({ ...prev, isOpen: !!contactId }));
    } else if (roomId === "desk zone" || (roomId.startsWith("meeting (") && roomId.includes("-"))) {
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
        console.log("[useLivekit] fetched token for room:", config.roomId);

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
  return roomId === "lobby" && contactId ? contactId : roomId;
};
