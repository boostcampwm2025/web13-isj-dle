import { RoomType } from "./room.types";

export enum BreakoutEventType {
  BREAKOUT_CREATE = "breakout:create",
  BREAKOUT_UPDATE = "breakout:update",
  BREAKOUT_ASSIGN = "breakout:assign",
  BREAKOUT_END = "breakout:end",
}

export interface BreakoutRoom {
  roomId: RoomType;
  userIds: string[];
}

export interface BreakoutConfig {
  roomCount: number;
  isRandom: boolean;
}
export interface BreakoutState {
  isActive: boolean;
  rooms: BreakoutRoom[];
  hostId: string | null;
}
