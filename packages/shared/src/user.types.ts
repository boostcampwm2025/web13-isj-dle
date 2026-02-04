import { Avatar } from "./avatar.types";
import { DeskStatus } from "./knock.types";

export interface User {
  socketId: string;
  userId: number;
  contactId: string | null;
  nickname: string;
  cameraOn: boolean;
  micOn: boolean;
  avatar: Avatar;
  deskStatus: DeskStatus | null;
}

export enum UserEventType {
  USER_SYNC = "user:sync",
  USER_JOIN = "user:join",
  USER_LEFT = "user:left",
  USER_UPDATE = "user:update",
  USER_INFO_UPDATE = "user:info_update",
  PLAYER_MOVE = "player:move",
  PLAYER_MOVED = "player:moved",
  BOUNDARY_UPDATE = "boundary:update",
}
