import { Injectable, Logger } from "@nestjs/common";

import type { DeskStatus, Knock } from "@shared/types";

@Injectable()
export class KnockService {
  private pendingKnocks = new Map<string, Knock>();

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

  removeAllKnocksForUser(userId: string): void {
    for (const [key] of this.pendingKnocks) {
      if (key.startsWith(userId) || key.endsWith(userId)) {
        this.pendingKnocks.delete(key);
      }
    }
  }

  getPendingKnock(fromUserId: string, toUserId: string): Knock | undefined {
    const key = this.getKnockKey(fromUserId, toUserId);
    return this.pendingKnocks.get(key);
  }
}
