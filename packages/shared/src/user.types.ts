import { Avatar } from "./avatar.types";

export interface User {
  id: string;
  contactId: string | null;
  nickname: string;
  cameraOn: boolean;
  micOn: boolean;
  avatar: Avatar;
}

export enum UserEventType {
  USER_SYNC = "user:sync",
  USER_JOIN = "user:join",
  USER_LEFT = "user:left",
}
