import { Injectable } from "@nestjs/common";

import { BreakoutConfig, BreakoutRoom, BreakoutState, RoomType } from "@shared/types";

@Injectable()
export class BreakoutService {
  private states: Map<RoomType, BreakoutState> = new Map();

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

  createBreakout(hostRoomId: RoomType, hostId: string, config: BreakoutConfig, userIds: string[]): BreakoutState {
    const { roomCount, isRandom } = config;

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
    };

    this.states.set(hostRoomId, state);
    return state;
  }

  getBreakoutState(roomId: RoomType): BreakoutState | null {
    return this.states.get(roomId) ?? null;
  }

  endBreakout(roomId: RoomType): void {
    this.states.delete(roomId);
  }
}
