import { Injectable } from "@nestjs/common";

import { TILE_SIZE, type User } from "@shared/types";

const BOUNDARY_TILES = 1;

@Injectable()
export class BoundaryService {
  findConnectedGroups(users: User[]): Map<string, string[]> {
    const eligibleUsers = users.filter((user) => user.avatar.state === "idle" || user.contactId !== null);
    const visited = new Set<string>();
    const groups = new Map<string, string[]>();

    const adjacency = new Map<string, string[]>();
    const tileMap = new Map<string, User[]>();
    for (const user of eligibleUsers) {
      adjacency.set(user.socketId, []);
      const tx = Math.floor(user.avatar.x / TILE_SIZE);
      const ty = Math.floor(user.avatar.y / TILE_SIZE);
      const key = `${tx},${ty}`;
      if (!tileMap.has(key)) tileMap.set(key, []);
      tileMap.get(key)!.push(user);
    }

    for (const user of eligibleUsers) {
      const tx = Math.floor(user.avatar.x / TILE_SIZE);
      const ty = Math.floor(user.avatar.y / TILE_SIZE);

      for (let dx = -BOUNDARY_TILES; dx <= BOUNDARY_TILES; dx++) {
        for (let dy = -BOUNDARY_TILES; dy <= BOUNDARY_TILES; dy++) {
          const neighbors = tileMap.get(`${tx + dx},${ty + dy}`) ?? [];
          for (const neighbor of neighbors) {
            if (neighbor.socketId === user.socketId) continue;
            adjacency.get(user.socketId)!.push(neighbor.socketId);
          }
        }
      }
    }

    for (const user of eligibleUsers) {
      if (visited.has(user.socketId)) continue;

      const neighbors = adjacency.get(user.socketId)!;
      if (neighbors.length === 0) {
        visited.add(user.socketId);
        continue;
      }

      const component: string[] = [];
      const queue: string[] = [user.socketId];
      let head = 0;

      while (head < queue.length) {
        const current = queue[head++];
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

  createGroupId(socketIds: string[]): string {
    return [...socketIds].sort((a, b) => a.localeCompare(b)).join("-");
  }
}
