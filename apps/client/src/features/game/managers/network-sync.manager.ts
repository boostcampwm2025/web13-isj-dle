import type { Socket } from "socket.io-client";

import type { AvatarDirection, AvatarState, UserEventType } from "@shared/types";

export class NetworkSyncManager {
  private socket?: Socket;
  private lastEmitted: { x: number; y: number; direction: AvatarDirection; state: AvatarState; time: number } = {
    x: 0,
    y: 0,
    direction: "down",
    state: "idle",
    time: 0,
  };
  private threshold: number = 16;

  setSocket(socket: Socket): void {
    this.socket = socket;
  }

  isInitialized(): boolean {
    return !!this.socket;
  }

  emitPlayerPosition(
    x: number,
    y: number,
    direction: AvatarDirection,
    state: AvatarState,
    eventType: typeof UserEventType.PLAYER_MOVE,
  ): void {
    if (!this.socket) return;

    const currentX = Math.round(x);
    const currentY = Math.round(y);

    const now = Date.now();
    if (
      (this.lastEmitted.x === currentX &&
        this.lastEmitted.y === currentY &&
        this.lastEmitted.direction === direction &&
        this.lastEmitted.state === state) ||
      now - this.lastEmitted.time < this.threshold
    ) {
      return;
    }

    this.socket.emit(eventType, {
      x: currentX,
      y: currentY,
      direction,
      state,
    });

    this.lastEmitted = {
      x: currentX,
      y: currentY,
      direction,
      state,
      time: now,
    };
  }
}
