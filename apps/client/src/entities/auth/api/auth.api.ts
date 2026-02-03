import { SERVER_URL } from "../../../shared/config/server.config";

import type { UpdateAuthUserPayload } from "@shared/types";

export const authApi = {
  getMe(): Promise<Response> {
    return fetch(`${SERVER_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });
  },

  updateAuthUser(payload: UpdateAuthUserPayload): Promise<Response> {
    return fetch(`${SERVER_URL}/api/auth/update`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  loginWithGithub() {
    window.location.href = `${SERVER_URL}/api/auth/github`;
  },

  logout(): Promise<Response> {
    return fetch(`${SERVER_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },

  tutorialCompleted(): Promise<Response> {
    return fetch(`${SERVER_URL}/api/auth/tutorial/completed`, {
      method: "GET",
      credentials: "include",
    });
  },
};
