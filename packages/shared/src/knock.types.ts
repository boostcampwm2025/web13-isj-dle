export type DeskStatus = "available" | "focusing" | "talking";

export enum KnockEventType {
  KNOCK_SEND = "knock:send",
  KNOCK_RECEIVED = "knock:received",
  KNOCK_ACCEPT = "knock:accept",
  KNOCK_ACCEPTED = "knock:accepted",
  KNOCK_ACCEPT_SUCCESS = "knock:accept:success",
  KNOCK_ACCEPT_FAILED = "knock:accept:failed",
  KNOCK_REJECT = "knock:reject",
  KNOCK_REJECTED = "knock:rejected",
  KNOCK_CANCELLED = "knock:cancelled",
  DESK_STATUS_UPDATE = "desk:status:update",
  DESK_STATUS_UPDATED = "desk:status:updated",
  TALK_END = "talk:end",
  TALK_ENDED = "talk:ended",
}

export interface KnockSendPayload {
  targetSocketId: string;
}

export interface KnockReceivedPayload {
  fromSocketId: string;
  fromUserNickname: string;
  timestamp: number;
}

export interface KnockResponsePayload {
  fromSocketId: string;
}

export interface KnockResultPayload {
  targetSocketId: string;
  targetUserNickname: string;
  status: "accepted" | "rejected";
}

export interface DeskStatusUpdatePayload {
  status: DeskStatus;
}

export interface DeskStatusUpdatedPayload {
  socketId: string;
  status: DeskStatus;
}

export interface Knock {
  fromSocketId: string;
  fromUserNickname: string;
  timestamp: number;
}

export interface KnockCancelledPayload {
  fromSocketId?: string;
  targetSocketId?: string;
}

export interface KnockAcceptSuccessPayload {
  fromSocketId: string;
}

export interface KnockAcceptFailedPayload {
  fromSocketId: string;
  reason: string;
}
