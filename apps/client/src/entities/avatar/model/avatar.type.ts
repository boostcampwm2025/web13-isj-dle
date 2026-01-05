import type { AvatarAssetKey } from "./avatar-asset";

export type AvatarDirection = "up" | "down" | "left" | "right";

export interface Avatar {
  id: string;
  x: number;
  y: number;
  currentRoomId: string;
  direction: AvatarDirection;
  assetKey: AvatarAssetKey;
}
