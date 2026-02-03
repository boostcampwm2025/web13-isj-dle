import { TILE_SIZE, type User } from "@shared/types";

import { BoundaryService } from "../../src/boundary/boundary.service";

describe("BoundaryService", () => {
  let service: BoundaryService;

  beforeEach(() => {
    service = new BoundaryService();
  });

  const createMockUser = (id: string, x: number, y: number, state: "idle" | "walk" | "sit" = "idle"): User => ({
    id,
    contactId: null,
    nickname: `User ${id}`,
    cameraOn: true,
    micOn: true,
    deskStatus: null,
    avatar: {
      x,
      y,
      currentRoomId: "lobby",
      direction: "down",
      state,
      assetKey: "ADAM",
    },
  });

  describe("isWithinBoundary", () => {
    it("같은 타일 내 두 위치는 true를 반환해야 함", () => {
      expect(service.isWithinBoundary(0, 0, 15, 15)).toBe(true);
      expect(service.isWithinBoundary(5, 5, 10, 10)).toBe(true);
    });

    it("1타일 거리 이내면 true를 반환해야 함", () => {
      expect(service.isWithinBoundary(0, 0, TILE_SIZE, 0)).toBe(true); // 오른쪽 1타일
      expect(service.isWithinBoundary(0, 0, 0, TILE_SIZE)).toBe(true); // 아래쪽 1타일
      expect(service.isWithinBoundary(0, 0, TILE_SIZE, TILE_SIZE)).toBe(true); // 대각선 1타일
    });

    it("1타일 초과 거리면 false를 반환해야 함", () => {
      expect(service.isWithinBoundary(0, 0, TILE_SIZE * 2, 0)).toBe(false);
      expect(service.isWithinBoundary(0, 0, 0, TILE_SIZE * 2)).toBe(false);
      expect(service.isWithinBoundary(0, 0, TILE_SIZE * 3, TILE_SIZE * 3)).toBe(false);
    });

    it("음수 좌표를 처리할 수 있어야 함", () => {
      expect(service.isWithinBoundary(-TILE_SIZE, 0, 0, 0)).toBe(true);
      expect(service.isWithinBoundary(-TILE_SIZE * 2, 0, 0, 0)).toBe(false);
    });
  });

  describe("areUsersInBoundary", () => {
    it("가까운 사용자는 true를 반환해야 함", () => {
      const user1 = createMockUser("1", 0, 0);
      const user2 = createMockUser("2", TILE_SIZE, 0);

      expect(service.areUsersInBoundary(user1, user2)).toBe(true);
    });

    it("멀리 떨어진 사용자는 false를 반환해야 함", () => {
      const user1 = createMockUser("1", 0, 0);
      const user2 = createMockUser("2", TILE_SIZE * 3, 0);

      expect(service.areUsersInBoundary(user1, user2)).toBe(false);
    });
  });

  describe("findConnectedGroups", () => {
    it("사용자가 없으면 빈 맵을 반환해야 함", () => {
      const result = service.findConnectedGroups([]);

      expect(result.size).toBe(0);
    });

    it("사용자가 한 명이면 빈 맵을 반환해야 함", () => {
      const users = [createMockUser("1", 0, 0)];
      const result = service.findConnectedGroups(users);

      expect(result.size).toBe(0);
    });

    it("사용자가 너무 멀리 떨어져 있으면 빈 맵을 반환해야 함", () => {
      const users = [createMockUser("1", 0, 0), createMockUser("2", TILE_SIZE * 5, 0)];

      const result = service.findConnectedGroups(users);

      expect(result.size).toBe(0);
    });

    it("가까운 두 사용자를 그룹화해야 함", () => {
      const users = [createMockUser("1", 0, 0), createMockUser("2", TILE_SIZE, 0)];

      const result = service.findConnectedGroups(users);

      expect(result.size).toBe(1);
      const group = Array.from(result.values())[0];
      expect(group).toContain("1");
      expect(group).toContain("2");
    });

    it("연결된 여러 사용자를 하나의 그룹으로 묶어야 함", () => {
      // 연결된 3명의 유저: 1 -- 2 -- 3
      const users = [
        createMockUser("1", 0, 0),
        createMockUser("2", TILE_SIZE, 0),
        createMockUser("3", TILE_SIZE * 2, 0),
      ];

      const result = service.findConnectedGroups(users);

      expect(result.size).toBe(1);
      const group = Array.from(result.values())[0];
      expect(group).toHaveLength(3);
    });

    it("분리된 클러스터는 별도의 그룹으로 생성해야 함", () => {
      const users = [
        createMockUser("1", 0, 0),
        createMockUser("2", TILE_SIZE, 0),
        createMockUser("3", TILE_SIZE * 10, 0),
        createMockUser("4", TILE_SIZE * 11, 0),
      ];

      const result = service.findConnectedGroups(users);

      expect(result.size).toBe(2);
    });

    it("걷는 중이고 contactId가 없는 사용자는 제외해야 함", () => {
      const users = [createMockUser("1", 0, 0, "idle"), createMockUser("2", TILE_SIZE, 0, "walk")];

      const result = service.findConnectedGroups(users);

      expect(result.size).toBe(0);
    });

    it("걷는 중이더라도 contactId가 있으면 포함해야 함", () => {
      const user1 = createMockUser("1", 0, 0, "idle");
      const user2 = createMockUser("2", TILE_SIZE, 0, "walk");
      user2.contactId = "some-contact-id";

      const users = [user1, user2];
      const result = service.findConnectedGroups(users);

      expect(result.size).toBe(1);
    });
  });

  describe("createGroupId", () => {
    it("사용자 ID를 정렬하여 그룹 ID를 생성해야 함", () => {
      const result = service.createGroupId(["c", "a", "b"]);

      expect(result).toBe("a-b-c");
    });

    it("입력 순서와 관계없이 동일한 결과를 반환해야 함", () => {
      const result1 = service.createGroupId(["user1", "user2", "user3"]);
      const result2 = service.createGroupId(["user3", "user1", "user2"]);

      expect(result1).toBe(result2);
    });

    it("단일 사용자 ID를 처리할 수 있어야 함", () => {
      const result = service.createGroupId(["single"]);

      expect(result).toBe("single");
    });
  });
});
