import { Injectable } from "@nestjs/common";

import type { DeskStatus, Knock } from "@shared/types";

@Injectable()
export class KnockService {
  private pendingKnocks = new Map<string, Knock>();
  private talkingPairs = new Map<string, string>();

  private getKnockKey(fromUserId: string, toUserId: string): string {
    return `${fromUserId}-${toUserId}`;
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

  hasPendingKnock(fromUserId: string, toUserId: string): boolean {
    const key = this.getKnockKey(fromUserId, toUserId);
    return this.pendingKnocks.has(key);
  }

  addPendingKnock(knock: Knock, toUserId: string): void {
    const key = this.getKnockKey(knock.fromUserId, toUserId);
    this.pendingKnocks.set(key, knock);
  }

  removePendingKnock(fromUserId: string, toUserId: string): void {
    const key = this.getKnockKey(fromUserId, toUserId);
    this.pendingKnocks.delete(key);
  }

  removeAllKnocksForUser(userId: string): { sentTo: string[]; receivedFrom: string[] } {
    const sentTo: string[] = [];
    const receivedFrom: string[] = [];

    for (const [key] of this.pendingKnocks) {
      const [fromId, toId] = key.split("-");
      if (fromId === userId) {
        sentTo.push(toId);
        this.pendingKnocks.delete(key);
      } else if (toId === userId) {
        receivedFrom.push(fromId);
        this.pendingKnocks.delete(key);
      }
    }

    return { sentTo, receivedFrom };
  }

  getPendingKnock(fromUserId: string, toUserId: string): Knock | undefined {
    const key = this.getKnockKey(fromUserId, toUserId);
    return this.pendingKnocks.get(key);
  }

  addTalkingPair(userId1: string, userId2: string): void {
    this.talkingPairs.set(userId1, userId2);
    this.talkingPairs.set(userId2, userId1);
  }

  removeTalkingPair(userId: string): string | undefined {
    const partnerId = this.talkingPairs.get(userId);
    if (partnerId) {
      this.talkingPairs.delete(userId);
      this.talkingPairs.delete(partnerId);
    }
    return partnerId;
  }

  getTalkingPartner(userId: string): string | undefined {
    return this.talkingPairs.get(userId);
  }
}
