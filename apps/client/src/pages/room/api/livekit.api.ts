import type { LivekitRoomConfig, LivekitTokenResponse } from "@shared/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const requestLivekitToken = async (
  config: LivekitRoomConfig,
  signal?: AbortSignal,
): Promise<LivekitTokenResponse> => {
  const res = await fetch(`${API_URL}/livekit/token`, {
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
