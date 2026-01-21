import { Injectable } from "@nestjs/common";

import { LecternState, RoomType } from "@shared/types";

@Injectable()
export class LecternService {
  private states: Map<RoomType, LecternState> = new Map();

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
}
