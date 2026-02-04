import { SERVER_URL } from "@shared/config";

export const fetcher = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${SERVER_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} (${path})`);
  }

  const data = (await response.json()) as T;

  return data;
};
