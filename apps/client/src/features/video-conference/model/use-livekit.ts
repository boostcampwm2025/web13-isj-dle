import { useEffect, useState } from "react";

import { requestLivekitToken } from "@features/video-conference/api/livekit.api";
import type { LivekitRoomConfig } from "@shared/types";

interface UseLivekitState {
  token: string | null;
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useLivekit(config: LivekitRoomConfig | null): UseLivekitState {
  const [livekitState, setLivekitState] = useState<UseLivekitState>({
    token: null,
    serverUrl: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!config) return;
    const controller = new AbortController();

    (async () => {
      setLivekitState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await requestLivekitToken(config, controller.signal);

        setLivekitState({ token: data.token, serverUrl: data.url, isLoading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;

        setLivekitState({
          token: null,
          serverUrl: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    })();

    return () => controller.abort();
  }, [config]);

  return livekitState;
}
