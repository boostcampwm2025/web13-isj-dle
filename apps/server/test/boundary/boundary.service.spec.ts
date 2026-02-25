import { TILE_SIZE, type User } from "@shared/types";
import { BoundaryService } from "src/boundary/boundary.service";

const MAP_TILES = 100;

function createMockUsers(count: number, spread: "random" | "clustered"): User[] {
  return Array.from({ length: count }, (_, i) => {
    const tx = spread === "random" ? Math.floor(Math.random() * MAP_TILES) : Math.floor(Math.random() * 10);
    const ty = spread === "random" ? Math.floor(Math.random() * MAP_TILES) : Math.floor(Math.random() * 10);

    return {
      socketId: `socket-${i}`,
      userId: i,
      contactId: null,
      nickname: `User${i}`,
      cameraOn: false,
      micOn: false,
      avatar: {
        x: tx * TILE_SIZE,
        y: ty * TILE_SIZE,
        currentRoomId: "lobby",
        direction: "down",
        state: "idle",
        assetKey: "ADAM",
      },
      deskStatus: null,
    } as User;
  });
}

// 기존 O(n²) 인접 리스트 구축 로직
function findConnectedGroupsLegacy(service: BoundaryService, users: User[]): Map<string, string[]> {
  const eligibleUsers = users.filter((u) => u.avatar.state === "idle" || u.contactId !== null);
  const visited = new Set<string>();
  const groups = new Map<string, string[]>();

  const adjacency = new Map<string, string[]>();
  for (const user of eligibleUsers) {
    adjacency.set(user.socketId, []);
  }

  for (let i = 0; i < eligibleUsers.length; i++) {
    for (let j = i + 1; j < eligibleUsers.length; j++) {
      const tx1 = Math.floor(eligibleUsers[i].avatar.x / TILE_SIZE);
      const ty1 = Math.floor(eligibleUsers[i].avatar.y / TILE_SIZE);
      const tx2 = Math.floor(eligibleUsers[j].avatar.x / TILE_SIZE);
      const ty2 = Math.floor(eligibleUsers[j].avatar.y / TILE_SIZE);
      if (Math.max(Math.abs(tx1 - tx2), Math.abs(ty1 - ty2)) <= 1) {
        adjacency.get(eligibleUsers[i].socketId)!.push(eligibleUsers[j].socketId);
        adjacency.get(eligibleUsers[j].socketId)!.push(eligibleUsers[i].socketId);
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

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      component.push(current);

      for (const neighbor of adjacency.get(current)!) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }

    if (component.length > 1) {
      const groupId = service.createGroupId(component);
      groups.set(groupId, component);
    }
  }

  return groups;
}

function measure(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

describe("BoundaryService 성능 비교: O(n²) vs Grid", () => {
  let service: BoundaryService;

  const results: {
    배치: string;
    "유저 수": number;
    "O(n²) (ms)": string;
    "Grid (ms)": string;
    "개선율 (%)": string;
  }[] = [];

  beforeEach(() => {
    service = new BoundaryService();
  });

  afterAll(() => {
    console.table(results);
  });

  const USER_COUNTS = [50, 100, 200, 500];

  describe("분산 배치 (random spread)", () => {
    test.each(USER_COUNTS)("유저 %d명", (count) => {
      const users = createMockUsers(count, "random");

      const legacyTime = measure(() => findConnectedGroupsLegacy(service, users));
      const gridTime = measure(() => service.findConnectedGroups(users));

      results.push({
        배치: "random",
        "유저 수": count,
        "O(n²) (ms)": legacyTime.toFixed(3),
        "Grid (ms)": gridTime.toFixed(3),
        "개선율 (%)": ((1 - gridTime / legacyTime) * 100).toFixed(1),
      });

      expect(gridTime).toBeLessThanOrEqual(legacyTime * 2);
    });
  });

  describe("밀집 배치 (clustered - 10x10 타일 내)", () => {
    test.each(USER_COUNTS)("유저 %d명", (count) => {
      const users = createMockUsers(count, "clustered");

      const legacyTime = measure(() => findConnectedGroupsLegacy(service, users));
      const gridTime = measure(() => service.findConnectedGroups(users));

      results.push({
        배치: "clustered",
        "유저 수": count,
        "O(n²) (ms)": legacyTime.toFixed(3),
        "Grid (ms)": gridTime.toFixed(3),
        "개선율 (%)": ((1 - gridTime / legacyTime) * 100).toFixed(1),
      });

      expect(gridTime).toBeLessThanOrEqual(legacyTime * 2);
    });
  });
});
