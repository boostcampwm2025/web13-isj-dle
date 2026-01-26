import { SERVER_URL } from "@shared/config";
import type { RandomRetrospectiveTemplateResponse } from "@shared/types";

export const requestRetrospectiveTemplate = async (): Promise<RandomRetrospectiveTemplateResponse> => {
  const res = await fetch(`${SERVER_URL}/api/meeting/retrospective-template`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
};
