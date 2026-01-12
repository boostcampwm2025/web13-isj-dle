import { useEffect, useState } from "react";

import type { LivekitRoomConfig, LivekitTokenResponse } from "@shared/types";

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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/livekit/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as LivekitTokenResponse;

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
