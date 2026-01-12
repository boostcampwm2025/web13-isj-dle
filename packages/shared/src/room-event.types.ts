import type { RoomType } from "./room.types";
import type { User } from "./user.types";

export enum RoomEventType {
  ROOM_JOIN = "room:join",
  ROOM_JOINED = "room:joined",
}

export interface RoomJoinPayload {
  roomId: RoomType;
}

export interface RoomJoinedPayload {
  userId: string;
  roomId: RoomType;
  users: User[];
}
