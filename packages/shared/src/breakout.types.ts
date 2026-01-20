export enum BreakoutEventType {
  BREAKOUT_CREATE = "breakout:create",
  BREAKOUT_UPDATE = "breakout:update",
  BREAKOUT_END = "breakout:end",
}

export interface BreakoutRoom {
  roomId: string;
  userIds: string[];
}

export interface BreakoutConfig {
  roomCount: number;
  isRandom: boolean;
}

export interface BreakoutState {
  isActive: boolean;
  hostRoomId: string;
  rooms: BreakoutRoom[];
  hostId: string | null;
}
