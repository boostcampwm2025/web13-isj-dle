import { SERVER_URL } from "../../../shared/config/server.config";

import type { AuthUser, UpdateAuthUserPayload } from "@shared/types";

export const authApi = {
  async getMe(): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  },

  async updateAuthUser({ userId, nickname, avatarAssetKey }: UpdateAuthUserPayload) {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/update`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, nickname, avatarAssetKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to update user:", error);
      return null;
    }
  },

  loginWithGithub() {
    window.location.href = `${SERVER_URL}/api/auth/github`;
  },

  async logout() {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to logout:", error);
      return null;
    }
  },
};
