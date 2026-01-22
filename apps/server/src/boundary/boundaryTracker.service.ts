import { Injectable } from "@nestjs/common";

import { randomUUID } from "crypto";

const INACTIVE_TICKS_TO_EXPIRE = 3;

interface UserState {
  contactId: string | null;
  groupSignature: string | null;
  outOfGroupTicks: number;
}

@Injectable()
export class BoundaryTracker {
  private readonly states = new Map<string, UserState>();
  private readonly groupContactIds = new Map<string, { contactId: string; inactiveTicks: number }>();

  private getOrCreate(userId: string): UserState {
    let state = this.states.get(userId);
    if (!state) {
      state = { contactId: null, groupSignature: null, outOfGroupTicks: 0 };
      this.states.set(userId, state);
    }
    return state;
  }

  joinGroup(userId: string, groupSignature: string): string | undefined {
    const state = this.getOrCreate(userId);
    const contactId = this.getOrCreateGroupContactId(groupSignature);

    if (state.groupSignature === groupSignature && state.contactId === contactId) {
      return undefined;
    }

    state.groupSignature = groupSignature;
    state.contactId = contactId;
    state.outOfGroupTicks = 0;
    return contactId;
  }

  leaveGroup(userId: string): null | undefined {
    const state = this.getOrCreate(userId);

    if (state.contactId === null) {
      return undefined;
    }

    state.outOfGroupTicks += 1;
    if (state.outOfGroupTicks < INACTIVE_TICKS_TO_EXPIRE) {
      return undefined;
    }

    state.groupSignature = null;
    state.contactId = null;
    state.outOfGroupTicks = 0;
    return null;
  }

  getContactId(userId: string): string | null {
    return this.states.get(userId)?.contactId ?? null;
  }

  clear(userId: string): void {
    this.states.delete(userId);
  }

  pruneInactiveGroups(activeGroupSignatures: Set<string>): void {
    for (const signature of activeGroupSignatures) {
      const existing = this.groupContactIds.get(signature);
      if (existing) existing.inactiveTicks = 0;
    }

    for (const [signature, entry] of this.groupContactIds) {
      if (activeGroupSignatures.has(signature)) continue;

      entry.inactiveTicks += 1;
      if (entry.inactiveTicks >= INACTIVE_TICKS_TO_EXPIRE) {
        this.groupContactIds.delete(signature);
      }
    }
  }

  private getOrCreateGroupContactId(groupSignature: string): string {
    const existing = this.groupContactIds.get(groupSignature);
    if (existing) {
      existing.inactiveTicks = 0;
      return existing.contactId;
    }

    const contactId = randomUUID();
    this.groupContactIds.set(groupSignature, { contactId, inactiveTicks: 0 });
    return contactId;
  }
}
