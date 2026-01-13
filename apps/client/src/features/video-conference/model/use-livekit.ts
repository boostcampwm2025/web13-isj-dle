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

export function useLivekit(): UseLivekitState {
  const { user } = useUser();
  const [config, setConfig] = useState<LivekitRoomConfig | null>(null);
  const roomId = user?.avatar.currentRoomId;
  const userId = user?.id;
  const nickname = user?.nickname;
  const [livekitState, setLivekitState] = useState<UseLivekitState>({
    token: null,
    serverUrl: null,
    isLoading: false,
    error: null,
    isOpen: false,
  });

  useEffect(() => {
    if (!roomId || !userId || !nickname) return;

    const restoreConfig = () => {
      setConfig({
        roomId,
        userId,
        nickname,
      });

      if (roomId === "lobby" || roomId === "desk zone" || (roomId.startsWith("meeting (") && roomId.includes("-"))) {
        setLivekitState((prev) => ({ ...prev, isOpen: false }));
      } else {
        setLivekitState((prev) => ({ ...prev, isOpen: true }));
      }
    };

    restoreConfig();
  }, [roomId, userId, nickname]);

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
}
