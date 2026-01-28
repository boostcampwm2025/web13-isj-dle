import type { AvatarAssetKey } from "./avatar-assets";
import { RoomType } from "./room.types";

export type AvatarDirection = "up" | "down" | "left" | "right";
export type AvatarState = "idle" | "walk" | "run" | "sit";
export interface Avatar {
  x: number;
  y: number;
  currentRoomId: RoomType;
  direction: AvatarDirection;
  state: AvatarState;
  assetKey: AvatarAssetKey;
}
