import type { RoomType } from "@shared/types";

export const UserInternalEvent = {
  LEAVING_ROOM: "user.leaving-room",
  DISCONNECTING: "user.disconnecting",
} as const;

export interface UserLeavingRoomPayload {
  roomId: RoomType;
}

export interface UserDisconnectingPayload {
  clientId: string;
  nickname: string;
}
