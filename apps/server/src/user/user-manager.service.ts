import { Injectable, Logger } from "@nestjs/common";

import type { AvatarAssetKey, AvatarDirection, CreateGameUserDto, GameUser } from "@shared/types";

import { generateRandomAvatar } from "../avatar/avatar.generator";
import { generateUniqueNickname } from "../nickname/nickname.generator";

@Injectable()
export class UserManager {
  private readonly logger = new Logger(UserManager.name);
  private readonly sessions = new Map<string, GameUser>();

  createSession(dto: CreateGameUserDto): GameUser {
    const { id, contactId } = dto;

    const isDuplicateNickname = (nickname: string): boolean => {
      return Array.from(this.sessions.values()).some((user) => user.nickname === nickname);
    };

    const nickname = generateUniqueNickname(isDuplicateNickname);
    const avatar: AvatarAssetKey = generateRandomAvatar();

    const user: GameUser = {
      id,
      contactId,
      nickname,
      cameraOn: false,
      micOn: false,
      avatar,
      position: null,
      currentRoomId: null,
    };

    this.sessions.set(id, user);

    this.logger.log(`Session created: ${id} ${nickname}`);
    this.logger.debug(`👤 User: ${JSON.stringify(user, null, 2)}`);

    return user;
  }

  getSession(id: string): GameUser | undefined {
    return this.sessions.get(id);
  }

  getRoomSessions(roomId: string): GameUser[] {
    return Array.from(this.sessions.values()).filter((user) => user.currentRoomId === roomId);
  }

  getAllSessions(): GameUser[] {
    return Array.from(this.sessions.values());
  }

  updateSessionPosition(id: string, position: { x: number; y: number; direction: AvatarDirection }): boolean {
    const user = this.sessions.get(id);

    if (!user) {
      this.logger.warn(`Session not found for updating position: ${id}`);
      return false;
    }

    user.position = position;
    this.logger.debug(`Position updated: ${id} -> (${position.x}, ${position.y}, ${position.direction})`);

    return true;
  }

  updateSessionRoom(id: string, roomId: string): boolean {
    const user = this.sessions.get(id);

    if (!user) {
      this.logger.warn(`Session not found for updating room: ${id}`);
      return false;
    }

    user.currentRoomId = roomId;
    this.logger.debug(`Room Updated: ${id} -> (${roomId})`);

    return true;
  }

  updateSessionMedia(id: string, cameraOn: boolean, micOn: boolean): boolean {
    const user = this.sessions.get(id);

    if (!user) {
      this.logger.warn(`Session not found for updating media: ${id}`);
      return false;
    }

    user.cameraOn = cameraOn;
    user.micOn = micOn;
    this.logger.debug(`Media Updated: ${id} -> (camera: ${cameraOn}, mic: ${micOn})`);

    return true;
  }

  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      this.logger.log(`Session deleted: ${id}`);
    } else {
      this.logger.warn(`Session not found for deletion: ${id}`);
    }
    return deleted;
  }
}
