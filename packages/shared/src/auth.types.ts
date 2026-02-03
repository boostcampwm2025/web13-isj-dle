import { AvatarAssetKey } from "./avatar-assets";

export interface AuthUser {
  id: number;
  tutorialCompleted: boolean;
  gitHubId: number;
  nickname: string;
  avatarAssetKey: AvatarAssetKey;
  createdAt: Date;
}

export interface UpdateAuthUserPayload {
  nickname?: string;
  avatarAssetKey?: AvatarAssetKey;
}

export type AuthUserResponse = { user: AuthUser; error?: never } | { user?: never; error: string };

export type SuccessResponse = { success: true; error?: never } | { success: false; error: string };
