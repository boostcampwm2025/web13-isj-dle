import { SERVER_URL } from "@shared/config";
import { fetcher } from "@shared/lib/fetcher";
import type { AuthUserResponse, SuccessResponse, UpdateAuthUserPayload } from "@shared/types";

export const authApi = {
  loginWithGithub() {
    window.location.href = `${SERVER_URL}/api/auth/github`;
  },

  getMe(): Promise<AuthUserResponse> {
    return fetcher<AuthUserResponse>("/api/auth/me");
  },

  updateAuthUser(payload: UpdateAuthUserPayload): Promise<AuthUserResponse> {
    return fetcher<AuthUserResponse>("/api/auth/update", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  logout(): Promise<SuccessResponse> {
    return fetcher<SuccessResponse>("/api/auth/logout", {
      method: "POST",
    });
  },

  tutorialCompleted(): Promise<SuccessResponse> {
    return fetcher<SuccessResponse>("/api/auth/tutorial/completed");
  },
};
