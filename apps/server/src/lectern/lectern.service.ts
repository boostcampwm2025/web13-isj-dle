import { Injectable } from "@nestjs/common";

import { BreakoutConfig, BreakoutRoom, BreakoutState, LecternState, RoomType } from "@shared/types";

@Injectable()
export class LecternService {
  private states: Map<RoomType, LecternState> = new Map();
  private breakoutStates: Map<RoomType, BreakoutState> = new Map();

  private getOrCreateState(roomId: RoomType): LecternState {
    if (!this.states.has(roomId)) {
      this.states.set(roomId, { hostId: null, usersOnLectern: [], roomId: null });
    }
    return this.states.get(roomId)!;
  }

  enterLectern(roomId: RoomType, userId: string): LecternState {
    const state = this.getOrCreateState(roomId);

    if (state.usersOnLectern.includes(userId)) {
      return state;
    }

    state.usersOnLectern.push(userId);

    if (state.hostId === null) {
      state.hostId = userId;
    }

    return { ...state };
  }

  leaveLectern(roomId: RoomType, userId: string): LecternState {
    const state = this.getOrCreateState(roomId);

    state.usersOnLectern = state.usersOnLectern.filter((id) => id !== userId);

    if (state.hostId === userId) {
      state.hostId = state.usersOnLectern[0] ?? null;
    }

    return { ...state };
  }

  isHost(roomId: RoomType, userId: string): boolean {
    const state = this.states.get(roomId);
    return state?.hostId === userId;
  }

  removeUserFromAllLecterns(userId: string): Map<RoomType, LecternState> {
    const affectedRooms = new Map<RoomType, LecternState>();
    for (const [roomId, state] of this.states) {
      if (state.usersOnLectern.includes(userId)) {
        const newState = this.leaveLectern(roomId, userId);
        affectedRooms.set(roomId, newState);
      }
    }
    return affectedRooms;
  }

  private generateBreakoutRoomId(hostRoomId: string, index: number): string {
    const sanitized = hostRoomId.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    return `breakout-${sanitized}-${index + 1}`;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  createBreakout(
    hostRoomId: RoomType,
    hostId: string,
    config: BreakoutConfig,
    userIds: string[],
  ): BreakoutState | null {
    if (this.breakoutStates.has(hostRoomId)) {
      this.breakoutStates.delete(hostRoomId);
    }

    const { roomCount, isRandom } = config;

    if (isRandom && roomCount > userIds.length) {
      return null;
    }

    const rooms: BreakoutRoom[] = [];

    if (isRandom) {
      const shuffledUsers = this.shuffleArray([...userIds]);
      const usersPerRoom = Math.ceil(shuffledUsers.length / roomCount);

      for (let i = 0; i < roomCount; i++) {
        const start = i * usersPerRoom;
        const end = Math.min(start + usersPerRoom, shuffledUsers.length);
        const roomUserIds = shuffledUsers.slice(start, end);

        rooms.push({
          roomId: this.generateBreakoutRoomId(hostRoomId, i),
          userIds: roomUserIds,
        });
      }
    } else {
      for (let i = 0; i < roomCount; i++) {
        rooms.push({
          roomId: this.generateBreakoutRoomId(hostRoomId, i),
          userIds: [],
        });
      }
    }

    const state: BreakoutState = {
      isActive: true,
      hostRoomId,
      rooms,
      hostId,
      config,
    };

    this.breakoutStates.set(hostRoomId, state);
    return state;
  }

  getBreakoutState(roomId: RoomType): BreakoutState | null {
    return this.breakoutStates.get(roomId) ?? null;
  }

  endBreakout(roomId: RoomType): void {
    this.breakoutStates.delete(roomId);
  }

  joinBreakoutRoom(hostRoomId: RoomType, userId: string, targetRoomId: string): BreakoutState | null {
    const state = this.breakoutStates.get(hostRoomId);
    if (!state?.isActive) return null;

    state.rooms.forEach((room) => {
      room.userIds = room.userIds.filter((id) => id !== userId);
    });

    const targetRoom = state.rooms.find((room) => room.roomId === targetRoomId);
    if (targetRoom) {
      targetRoom.userIds.push(userId);
    }

    return state;
  }

  leaveBreakoutRoom(hostRoomId: RoomType, userId: string): BreakoutState | null {
    const state = this.breakoutStates.get(hostRoomId);
    if (!state?.isActive) return null;

    state.rooms.forEach((room) => {
      room.userIds = room.userIds.filter((id) => id !== userId);
    });

    return state;
  }
}
