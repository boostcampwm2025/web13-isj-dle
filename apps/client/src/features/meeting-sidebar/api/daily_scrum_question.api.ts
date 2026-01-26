import { SERVER_URL } from "@shared/config";
import type { RandomDailyScrumQuestionsResponse } from "@shared/types";

export const requestDailyScrumQuestion = async (n: number): Promise<RandomDailyScrumQuestionsResponse> => {
  const res = await fetch(`${SERVER_URL}/api/meeting/daily-scrum-question/${n}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
};
