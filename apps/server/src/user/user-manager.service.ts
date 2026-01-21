import { Injectable } from "@nestjs/common";

import type {
  Avatar,
  AvatarAssetKey,
  AvatarDirection,
  AvatarState,
  CreateGameUserDto,
  RoomType,
  User,
} from "@shared/types";

import { generateRandomAvatar } from "../avatar/avatar.generator";
import { generateUniqueNickname } from "../nickname/nickname.generator";

@Injectable()
export class UserManager {
  private readonly sessions = new Map<string, User>();

  createSession(dto: CreateGameUserDto): User {
    const { id } = dto;

    const isDuplicateNickname = (nickname: string): boolean => {
      return Array.from(this.sessions.values()).some((user) => user.nickname === nickname);
    };

    const nickname = generateUniqueNickname(isDuplicateNickname);
    const assetKey: AvatarAssetKey = generateRandomAvatar();
    const avatar: Avatar = {
      x: 0,
      y: 0,
      currentRoomId: "lobby",
      direction: "down",
      state: "idle",
      assetKey,
    };

    const user: User = {
      id,
      contactId: null,
      nickname,
      cameraOn: false,
      micOn: false,
      avatar,
    };

    this.sessions.set(id, user);

    return user;
  }

  getSession(id: string): User | undefined {
    return this.sessions.get(id);
  }

  getRoomSessions(roomId: RoomType): User[] {
    return Array.from(this.sessions.values()).filter((user) => user.avatar.currentRoomId === roomId);
  }

  getAllSessions(): User[] {
    return Array.from(this.sessions.values());
  }

  updateSessionPosition(
    id: string,
    position: { x: number; y: number; direction: AvatarDirection; state: AvatarState },
  ): boolean {
    const user = this.sessions.get(id);

    if (!user) return false;

    if (position.state === "sit") {
      const usersAtPosition = this.getUsersByPosition(position.x, position.y);
      const isAnotherUserSitting = usersAtPosition.some((u) => u.id !== id && u.avatar.state === "sit");
      if (isAnotherUserSitting) return false;
    }

    user.avatar = { ...user.avatar, ...position };

    return true;
  }

  updateSessionRoom(id: string, roomId: RoomType): boolean {
    const user = this.sessions.get(id);

    if (!user) return false;

    user.avatar.currentRoomId = roomId;

    return true;
  }

  updateSessionMedia(id: string, payload: { cameraOn?: boolean; micOn?: boolean }): boolean {
    const user = this.sessions.get(id);

    if (!user) return false;

    if (payload.cameraOn !== undefined) {
      user.cameraOn = payload.cameraOn;
    }
    if (payload.micOn !== undefined) {
      user.micOn = payload.micOn;
    }

    return true;
  }

  updateSessionContactId(id: string, contactId: string | null): boolean {
    const user = this.sessions.get(id);

    if (!user) return false;

    user.contactId = contactId;

    return true;
  }

  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    return deleted;
  }

  private getUsersByPosition(x: number, y: number): User[] {
    return Array.from(this.sessions.values()).filter((user) => {
      return user.avatar.x === x && user.avatar.y === y;
    });
  }
}
