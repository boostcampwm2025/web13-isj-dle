import { AvatarAssetKey } from "./avatar-assets";
import { AvatarDirection } from "./avatar.types";

export interface GameUser {
  id: string;
  contactId: string;
  nickname: string;
  cameraOn: boolean;
  micOn: boolean;

  avatar: AvatarAssetKey;
  position: {
    x: number;
    y: number;
    direction: AvatarDirection;
  } | null;
  currentRoomId: string | null;
}

export interface CreateGameUserDto {
  id: string;
  contactId: string;
}
