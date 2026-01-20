import { Injectable } from "@nestjs/common";

import { TILE_SIZE, type User } from "@shared/types";

const BOUNDARY_TILES = 1;

@Injectable()
export class BoundaryService {
  isWithinBoundary(x1: number, y1: number, x2: number, y2: number): boolean {
    const tileX1 = Math.floor(x1 / TILE_SIZE);
    const tileY1 = Math.floor(y1 / TILE_SIZE);
    const tileX2 = Math.floor(x2 / TILE_SIZE);
    const tileY2 = Math.floor(y2 / TILE_SIZE);

    const distance = Math.max(Math.abs(tileX1 - tileX2), Math.abs(tileY1 - tileY2));
    return distance <= BOUNDARY_TILES;
  }

  areUsersInBoundary(user1: User, user2: User): boolean {
    return this.isWithinBoundary(user1.avatar.x, user1.avatar.y, user2.avatar.x, user2.avatar.y);
  }

  findConnectedGroups(users: User[]): Map<string, string[]> {
    const eligibleUsers = users;
    const visited = new Set<string>();
    const groups = new Map<string, string[]>();

    // 인접 리스트 생성
    const adjacency = new Map<string, string[]>();
    for (const user of eligibleUsers) {
      adjacency.set(user.id, []);
    }

    for (let i = 0; i < eligibleUsers.length; i++) {
      for (let j = i + 1; j < eligibleUsers.length; j++) {
        if (this.areUsersInBoundary(eligibleUsers[i], eligibleUsers[j])) {
          adjacency.get(eligibleUsers[i].id)!.push(eligibleUsers[j].id);
          adjacency.get(eligibleUsers[j].id)!.push(eligibleUsers[i].id);
        }
      }
    }

    for (const user of eligibleUsers) {
      if (visited.has(user.id)) continue;

      const neighbors = adjacency.get(user.id)!;
      if (neighbors.length === 0) {
        visited.add(user.id);
        continue;
      }

      const component: string[] = [];
      const queue: string[] = [user.id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        component.push(current);

        for (const neighbor of adjacency.get(current)!) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (component.length > 1) {
        const groupId = this.createGroupId(component);
        groups.set(groupId, component);
      }
    }

    return groups;
  }

  createGroupId(userIds: string[]): string {
    return [...userIds].sort((a, b) => a.localeCompare(b)).join("-");
  }
}
