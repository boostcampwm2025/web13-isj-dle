import { Avatar } from "./avatar.types";
import type { RoomType } from "./room.types";

export enum RoomEventType {
  ROOM_JOIN = "room:join",
  ROOM_JOINED = "room:joined",
}

export interface RoomJoinPayload {
  roomId: RoomType;
}

export interface RoomJoinedPayload {
  socketId: string;
  avatar: Avatar;
}
