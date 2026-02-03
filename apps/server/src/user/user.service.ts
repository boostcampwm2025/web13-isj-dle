import { Injectable } from "@nestjs/common";

import type {
  Avatar,
  AvatarAssetKey,
  AvatarDirection,
  AvatarState,
  CreateGameUserDto,
  DeskStatus,
  RoomType,
  User,
} from "@shared/types";

import { AuthService } from "../auth/auth.service";
import { MetricsService, mapRoomIdToMetricType } from "../metrics";

@Injectable()
export class UserService {
  private readonly sessions = new Map<string, User>();
  private readonly roomOccupancy = new Map<string, number>();
  private readonly sessionStartTimes = new Map<string, number>();

  constructor(
    private readonly metricsService: MetricsService,
    private readonly authService: AuthService,
  ) {}

  async createSession(dto: CreateGameUserDto): Promise<User> {
    const { id, userId } = dto;

    const authUser = await this.authService.getAuthUserById(userId);
    if (!authUser) {
      throw new Error(`AuthUser not found for ID: ${userId}`);
    }
    const avatar: Avatar = {
      x: 600,
      y: 968,
      currentRoomId: "lobby",
      direction: "down",
      state: "idle",
      assetKey: authUser.avatarAssetKey,
    };

    const user: User = {
      id,
      userId: authUser.id,
      contactId: null,
      nickname: authUser.nickname,
      cameraOn: false,
      micOn: false,
      avatar,
      deskStatus: null,
    };

    this.sessions.set(id, user);
    this.sessionStartTimes.set(id, Date.now());

    const roomType = mapRoomIdToMetricType(avatar.currentRoomId);

    this.metricsService.userJoined(roomType);
    this.updateRoomOccupancy(avatar.currentRoomId, 1);

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

    const oldRoomId = user.avatar.currentRoomId;
    const oldRoomType = mapRoomIdToMetricType(oldRoomId);
    const newRoomType = mapRoomIdToMetricType(roomId);

    user.avatar.currentRoomId = roomId;

    if (roomId === "desk zone") {
      user.deskStatus = "available";
    } else {
      user.deskStatus = null;
    }

    this.metricsService.userMoved(oldRoomType, newRoomType);
    this.updateRoomOccupancy(oldRoomId, -1);
    this.updateRoomOccupancy(roomId, 1);

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

  updateSessionDeskStatus(id: string, status: DeskStatus | null): boolean {
    const user = this.sessions.get(id);

    if (!user) return false;

    user.deskStatus = status;

    return true;
  }

  deleteSession(id: string): boolean {
    const user = this.sessions.get(id);
    if (!user) return false;

    const roomId = user.avatar.currentRoomId;
    const roomType = mapRoomIdToMetricType(roomId);

    const startTime = this.sessionStartTimes.get(id);
    if (startTime) {
      const durationSec = (Date.now() - startTime) / 1000;
      this.metricsService.recordSessionDuration(durationSec);
      this.sessionStartTimes.delete(id);
    }

    this.metricsService.userLeft(roomType);
    this.updateRoomOccupancy(roomId, -1);

    return this.sessions.delete(id);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getUserCountByRoomType(): Map<string, number> {
    const cnt = new Map<string, number>();
    for (const user of this.sessions.values()) {
      const roomType = mapRoomIdToMetricType(user.avatar.currentRoomId);
      cnt.set(roomType, (cnt.get(roomType) || 0) + 1);
    }
    return cnt;
  }

  getActiveRoomCountByType(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const [roomId, occupancy] of this.roomOccupancy.entries()) {
      if (occupancy > 0) {
        const roomType = mapRoomIdToMetricType(roomId);
        counts.set(roomType, (counts.get(roomType) || 0) + 1);
      }
    }
    return counts;
  }

  private getUsersByPosition(x: number, y: number): User[] {
    return Array.from(this.sessions.values()).filter((user) => {
      return user.avatar.x === x && user.avatar.y === y;
    });
  }

  private updateRoomOccupancy(roomId: string, delta: number) {
    const current = this.roomOccupancy.get(roomId) || 0;
    const next = current + delta;
    const roomType = mapRoomIdToMetricType(roomId);

    if (next <= 0) {
      this.roomOccupancy.delete(roomId);
      if (current > 0) {
        this.metricsService.decrementActiveRooms(roomType);
      }
    } else {
      this.roomOccupancy.set(roomId, next);
      if (current === 0) {
        this.metricsService.incrementActiveRooms(roomType);
      }
    }
  }

  updateUserInfo(payload: { userId: number; nickname?: string; avatarAssetKey?: AvatarAssetKey }) {
    for (const user of this.sessions.values()) {
      if (user.userId === payload.userId) {
        if (payload.nickname !== undefined) {
          user.nickname = payload.nickname;
        }
        if (payload.avatarAssetKey !== undefined) {
          user.avatar.assetKey = payload.avatarAssetKey;
        }
      }
    }
  }
}
