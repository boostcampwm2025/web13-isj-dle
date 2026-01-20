export type DeskStatus = "available" | "focusing" | "talking";

export enum KnockEventType {
  KNOCK_SEND = "knock:send",
  KNOCK_RECEIVED = "knock:received",
  KNOCK_ACCEPT = "knock:accept",
  KNOCK_ACCEPTED = "knock:accepted",
  KNOCK_REJECT = "knock:reject",
  KNOCK_REJECTED = "knock:rejected",
  KNOCK_CANCEL = "knock:cancel",
  KNOCK_CANCELLED = "knock:cancelled",
  DESK_STATUS_UPDATE = "desk:status:update",
  DESK_STATUS_UPDATED = "desk:status:updated",
}

export interface KnockSendPayload {
  targetUserId: string;
}

export interface KnockReceivedPayload {
  fromUserId: string;
  fromUserNickname: string;
  timestamp: number;
}

export interface KnockResponsePayload {
  fromUserId: string;
}

export interface KnockResultPayload {
  targetUserId: string;
  targetUserNickname: string;
  status: "accepted" | "rejected";
}

export interface DeskStatusUpdatePayload {
  status: DeskStatus;
}

export interface DeskStatusUpdatedPayload {
  userId: string;
  status: DeskStatus;
}

export interface Knock {
  fromUserId: string;
  fromUserNickname: string;
  timestamp: number;
}
