import type { AvatarAssetKey } from "./avatar-assets";

export type AvatarDirection = "up" | "down" | "left" | "right";
export type AvatarState = "idle" | "walk" | "sit";
export interface Avatar {
  id: string;
  x: number;
  y: number;
  currentRoomId: string;
  direction: AvatarDirection;
  state: AvatarState;
  assetKey: AvatarAssetKey;
}
