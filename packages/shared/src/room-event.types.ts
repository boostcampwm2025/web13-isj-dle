export enum RoomEventType {
  ROOM_JOIN = "room:join",
  ROOM_JOINED = "room:joined",
}

export interface RoomJoinPayload {
  roomId: string;
}

export interface RoomJoinedPayload {
  userId: string;
  roomId: string;
  nickname: string;
}
