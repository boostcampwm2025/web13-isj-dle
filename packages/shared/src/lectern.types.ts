import { RoomType } from "./room.types";

export interface LecternState {
  hostSocketId: string | null;
  usersOnLectern: string[];
  roomId: RoomType | null;
}

export enum LecternEventType {
  LECTERN_ENTER = "lectern:enter",
  LECTERN_LEAVE = "lectern:leave",
  LECTERN_UPDATE = "lectern:update",
  MUTE_ALL = "lectern:mute-all",
  MUTE_ALL_EXECUTED = "lectern:mute-all-executed",
  BREAKOUT_CREATE = "lectern:breakout-create",
  BREAKOUT_UPDATE = "lectern:breakout-update",
  BREAKOUT_END = "lectern:breakout-end",
  BREAKOUT_JOIN = "lectern:breakout-join",
  BREAKOUT_LEAVE = "lectern:breakout-leave",
}

export interface BreakoutRoom {
  roomId: string;
  socketIds: string[];
}

export interface BreakoutConfig {
  roomCount: number;
  isRandom: boolean;
}

export interface BreakoutState {
  isActive: boolean;
  hostRoomId: string;
  rooms: BreakoutRoom[];
  hostSocketId: string | null;
  config: BreakoutConfig;
}
