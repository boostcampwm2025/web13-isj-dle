import { SERVER_URL } from "@shared/config";
import type { LivekitRoomConfig, LivekitTokenResponse } from "@shared/types";

export const requestLivekitToken = async (
  config: LivekitRoomConfig,
  signal?: AbortSignal,
): Promise<LivekitTokenResponse> => {
  const res = await fetch(`${SERVER_URL}/api/livekit/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
    signal,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
};
