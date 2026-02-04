import { Injectable } from "@nestjs/common";

import type { DeskStatus, Knock } from "@shared/types";

@Injectable()
export class KnockService {
  private pendingKnocks = new Map<string, Knock>();
  private talkingPairs = new Map<string, string>();

  private getKnockKey(fromSocketId: string, toSocketId: string): string {
    return `${fromSocketId}-${toSocketId}`;
  }

  canKnock(fromStatus: DeskStatus | null, toStatus: DeskStatus | null): { canKnock: boolean; reason?: string } {
    if (fromStatus === null) {
      return { canKnock: false, reason: "데스크존에서만 노크할 수 있습니다." };
    }

    if (toStatus === null) {
      return { canKnock: false, reason: "상대방이 데스크존에 없습니다." };
    }

    if (fromStatus !== "available") {
      return { canKnock: false, reason: "현재 노크를 보낼 수 없는 상태입니다." };
    }

    if (toStatus === "focusing") {
      return { canKnock: false, reason: "상대방이 집중 중입니다." };
    }

    if (toStatus === "talking") {
      return { canKnock: false, reason: "상대방이 대화 중입니다." };
    }

    return { canKnock: true };
  }

  hasPendingKnock(fromSocketId: string, toSocketId: string): boolean {
    const key = this.getKnockKey(fromSocketId, toSocketId);
    return this.pendingKnocks.has(key);
  }

  addPendingKnock(knock: Knock, toSocketId: string): void {
    const key = this.getKnockKey(knock.fromSocketId, toSocketId);
    this.pendingKnocks.set(key, knock);
  }

  removePendingKnock(fromSocketId: string, toSocketId: string): void {
    const key = this.getKnockKey(fromSocketId, toSocketId);
    this.pendingKnocks.delete(key);
  }

  removeAllKnocksForUser(socketId: string): { sentTo: string[]; receivedFrom: string[] } {
    const sentTo: string[] = [];
    const receivedFrom: string[] = [];

    for (const [key] of this.pendingKnocks) {
      const [fromId, toId] = key.split("-");
      if (fromId === socketId) {
        sentTo.push(toId);
        this.pendingKnocks.delete(key);
      } else if (toId === socketId) {
        receivedFrom.push(fromId);
        this.pendingKnocks.delete(key);
      }
    }

    return { sentTo, receivedFrom };
  }

  getPendingKnock(fromSocketId: string, toSocketId: string): Knock | undefined {
    const key = this.getKnockKey(fromSocketId, toSocketId);
    return this.pendingKnocks.get(key);
  }

  addTalkingPair(socketId1: string, socketId2: string): void {
    this.talkingPairs.set(socketId1, socketId2);
    this.talkingPairs.set(socketId2, socketId1);
  }

  removeTalkingPair(socketId: string): string | undefined {
    const partnerId = this.talkingPairs.get(socketId);
    if (partnerId) {
      this.talkingPairs.delete(socketId);
      this.talkingPairs.delete(partnerId);
    }
    return partnerId;
  }

  getTalkingPartner(socketId: string): string | undefined {
    return this.talkingPairs.get(socketId);
  }
}
