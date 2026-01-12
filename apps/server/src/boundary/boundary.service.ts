import { Injectable, Logger } from "@nestjs/common";

import type { User } from "@shared/types";

const BOUNDARY_RANGE = 2;
const TILE_SIZE = 16;
const MINIMUM_NUMBER_OF_MEMBERS = 2;

export interface BoundaryGroup {
  groupId: string;
  userIds: string[];
  contactId: string;
}

@Injectable()
export class BoundaryService {
  private readonly logger = new Logger(BoundaryService.name);

  // 두 아바타가 바운더리 범위 내에 있는지 확인 - 체비쇼프 거리(Chebyshev distance) 사용: 상하좌우 및 대각선 동일 취급
  isWithinBoundary(x1: number, y1: number, x2: number, y2: number): boolean {
    const tileX1 = Math.floor(x1 / TILE_SIZE);
    const tileY1 = Math.floor(y1 / TILE_SIZE);
    const tileX2 = Math.floor(x2 / TILE_SIZE);
    const tileY2 = Math.floor(y2 / TILE_SIZE);

    const dx = Math.abs(tileX1 - tileX2);
    const dy = Math.abs(tileY1 - tileY2);

    return Math.max(dx, dy) <= BOUNDARY_RANGE;
  }

  // 인접 리스트 생성: idle 기준, 그래프 무방향
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

  // 바운더리 그룹 탐색 (BFS)
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

        // 그룹 내 기존 contactId 찾기
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

      // 2명 이상인 그룹만 유효한 바운더리 그룹
      if (group.length >= MINIMUM_NUMBER_OF_MEMBERS) {
        const sortedIds = [...group].sort((a, b) => a.localeCompare(b));
        const groupId = sortedIds.join("-");

        // 기존 contactId가 있고, 그 contactId를 가진 모든 유저가 이 그룹에 포함되어 있으면 재사용
        // 그렇지 않으면 새로운 contactId 생성 (그룹이 분리된 경우)
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

  // 특정 유저가 속한 그룹 찾기
  findUserGroup(userId: string, groups: BoundaryGroup[]): BoundaryGroup | null {
    return groups.find((group) => group.userIds.includes(userId)) || null;
  }

  /**
   * 유저들의 contactId 업데이트
   * walk 상태인 유저는 contactId를 null로 설정
   * @returns contactId가 변경된 유저 ID 목록
   */
  updateContactIds(users: User[], groups: BoundaryGroup[]): Map<string, string | null> {
    const updates = new Map<string, string | null>();

    for (const user of users) {
      const isIdle = user.avatar.state === "idle";
      const group = isIdle ? this.findUserGroup(user.id, groups) : null;
      const newContactId = group?.contactId || null;

      if (user.contactId !== newContactId) {
        updates.set(user.id, newContactId);
        this.logger.debug(`ContactId changed: ${user.id} (${user.contactId} -> ${newContactId})`);
      }
    }

    return updates;
  }

  // 그룹에 새로운 contactId 할당 - 변경 가능
  private generateContactId(): string {
    return `contact-${Date.now()}-${Math.random().toString(36)}`;
  }
}
