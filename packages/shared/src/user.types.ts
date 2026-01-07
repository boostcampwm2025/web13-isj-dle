import { Avatar } from "./avatar.types";

export interface User {
  id: string;
  contactId: string;
  nickname: string;
  cameraOn: boolean;
  micOn: boolean;
  avatar: Avatar;
}
