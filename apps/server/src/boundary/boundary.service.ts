import { Injectable } from "@nestjs/common";

import { MINIMUM_NUMBER_OF_MEMBERS, TILE_SIZE, type User } from "@shared/types";

const BOUNDARY_RANGE = 1;

export interface BoundaryGroup {
  groupId: string;
  userIds: string[];
  contactId: string;
}

@Injectable()
export class BoundaryService {
  isWithinBoundary(x1: number, y1: number, x2: number, y2: number): boolean {
    const tileX1 = Math.floor(x1 / TILE_SIZE);
    const tileY1 = Math.floor(y1 / TILE_SIZE);
    const tileX2 = Math.floor(x2 / TILE_SIZE);
    const tileY2 = Math.floor(y2 / TILE_SIZE);

    const dx = Math.abs(tileX1 - tileX2);
    const dy = Math.abs(tileY1 - tileY2);

    return Math.max(dx, dy) <= BOUNDARY_RANGE;
  }

  private buildAdjacencyList(users: User[]): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    for (const user of users) {
      adjacency.set(user.id, []);
    }

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const userA = users[i];
        const userB = users[j];

        if (this.isWithinBoundary(userA.avatar.x, userA.avatar.y, userB.avatar.x, userB.avatar.y)) {
          const listA = adjacency.get(userA.id);
          const listB = adjacency.get(userB.id);

          if (!listA || !listB) {
            throw new Error("Adjacency list must be initialized before building edges");
          }

          listA.push(userB.id);
          listB.push(userA.id);
        }
      }
    }

    return adjacency;
  }

  findBoundaryGroups(users: User[]): BoundaryGroup[] {
    const idleUsers = users.filter((u) => u.avatar.state === "idle");
    if (idleUsers.length === 0) return [];

    const userMap = new Map(idleUsers.map((u) => [u.id, u]));
    const adjacency = this.buildAdjacencyList(idleUsers);
    const visited = new Set<string>();
    const groups: BoundaryGroup[] = [];

    for (const user of idleUsers) {
      if (visited.has(user.id)) continue;

      const group: string[] = [];
      const queue: string[] = [user.id];
      let head = 0;
      let existingContactId: string | null = null;

      while (head < queue.length) {
        const currentId = queue[head++];

        if (visited.has(currentId)) continue;
        visited.add(currentId);
        group.push(currentId);

        const currentUser = userMap.get(currentId);
        if (currentUser?.contactId && !existingContactId) {
          existingContactId = currentUser.contactId;
        }

        const neighbors = adjacency.get(currentId);
        if (!neighbors) {
          throw new Error(`Adjacency list missing for userId: ${currentId}`);
        }

        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            queue.push(neighborId);
          }
        }
      }

      if (group.length >= MINIMUM_NUMBER_OF_MEMBERS) {
        const sortedIds = [...group].sort((a, b) => a.localeCompare(b));
        const groupId = sortedIds.join("-");

        let contactId: string;
        if (existingContactId) {
          const usersWithSameContactId = idleUsers.filter((u) => u.contactId === existingContactId);
          const allIncluded = usersWithSameContactId.every((u) => sortedIds.includes(u.id));
          contactId = allIncluded ? existingContactId : this.generateContactId();
        } else {
          contactId = this.generateContactId();
        }

        groups.push({
          groupId,
          userIds: sortedIds,
          contactId,
        });
      }
    }

    return groups;
  }

  findUserGroup(userId: string, groups: BoundaryGroup[]): BoundaryGroup | null {
    return groups.find((group) => group.userIds.includes(userId)) || null;
  }

  updateContactIds(users: User[], groups: BoundaryGroup[]): Map<string, string | null> {
    const updates = new Map<string, string | null>();

    for (const user of users) {
      const isIdle = user.avatar.state === "idle";
      const group = isIdle ? this.findUserGroup(user.id, groups) : null;
      const newContactId = group?.contactId || null;

      if (user.contactId !== newContactId) {
        updates.set(user.id, newContactId);
      }
    }

    return updates;
  }

  private generateContactId(): string {
    return `contact-${Date.now()}-${Math.random().toString(36)}`;
  }
}
