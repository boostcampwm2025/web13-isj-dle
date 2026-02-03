import { BoundaryTracker } from "../../src/boundary/boundaryTracker.service";

describe("BoundaryTracker", () => {
  let tracker: BoundaryTracker;

  beforeEach(() => {
    tracker = new BoundaryTracker();
  });

  describe("joinGroup", () => {
    it("새 그룹에 합류하면 contactId를 반환해야 함", () => {
      const result = tracker.joinGroup("user1", "group-signature");

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("같은 그룹에 다시 합류하면 undefined를 반환해야 함", () => {
      tracker.joinGroup("user1", "group-signature");
      const result = tracker.joinGroup("user1", "group-signature");

      expect(result).toBeUndefined();
    });

    it("다른 그룹에 합류하면 새 contactId를 반환해야 함", () => {
      const contactId1 = tracker.joinGroup("user1", "group-a");
      const contactId2 = tracker.joinGroup("user1", "group-b");

      expect(contactId2).toBeDefined();
      expect(contactId2).not.toBe(contactId1);
    });

    it("같은 그룹의 사용자에게 동일한 contactId를 할당해야 함", () => {
      const contactId1 = tracker.joinGroup("user1", "shared-group");
      const contactId2 = tracker.joinGroup("user2", "shared-group");

      expect(contactId1).toBe(contactId2);
    });

    it("다시 합류하면 outOfGroupTicks를 초기화해야 함", () => {
      tracker.joinGroup("user1", "group-a");

      tracker.leaveGroup("user1");

      const result = tracker.joinGroup("user1", "group-a");

      expect(result).toBeUndefined();
    });
  });

  describe("leaveGroup", () => {
    it("contactId가 없는 사용자는 undefined를 반환해야 함", () => {
      const result = tracker.leaveGroup("unknown-user");

      expect(result).toBeUndefined();
    });

    it("INACTIVE_TICKS_TO_EXPIRE(3) 전에는 undefined를 반환해야 함", () => {
      tracker.joinGroup("user1", "group-a");

      expect(tracker.leaveGroup("user1")).toBeUndefined();
      expect(tracker.leaveGroup("user1")).toBeUndefined();

      expect(tracker.getContactId("user1")).not.toBeNull();
    });

    it("INACTIVE_TICKS_TO_EXPIRE(3) 후에는 null을 반환해야 함", () => {
      tracker.joinGroup("user1", "group-a");

      tracker.leaveGroup("user1");
      tracker.leaveGroup("user1");
      const result = tracker.leaveGroup("user1");

      expect(result).toBeNull();
      expect(tracker.getContactId("user1")).toBeNull();
    });
  });

  describe("getContactId", () => {
    it("알 수 없는 사용자는 null을 반환해야 함", () => {
      expect(tracker.getContactId("unknown")).toBeNull();
    });

    it("그룹 합류 후 contactId를 반환해야 함", () => {
      const contactId = tracker.joinGroup("user1", "group-a");

      expect(tracker.getContactId("user1")).toBe(contactId);
    });

    it("사용자가 완전히 그룹을 떠나면 null을 반환해야 함", () => {
      tracker.joinGroup("user1", "group-a");

      tracker.leaveGroup("user1");
      tracker.leaveGroup("user1");
      tracker.leaveGroup("user1");

      expect(tracker.getContactId("user1")).toBeNull();
    });
  });

  describe("clear", () => {
    it("사용자 상태를 제거해야 함", () => {
      tracker.joinGroup("user1", "group-a");

      tracker.clear("user1");

      expect(tracker.getContactId("user1")).toBeNull();
    });

    it("다른 사용자에게 영향을 주지 않아야 함", () => {
      tracker.joinGroup("user1", "group-a");
      tracker.joinGroup("user2", "group-a");

      tracker.clear("user1");

      expect(tracker.getContactId("user1")).toBeNull();
      expect(tracker.getContactId("user2")).not.toBeNull();
    });
  });

  describe("pruneInactiveGroups", () => {
    it("활성 그룹은 유지해야 함", () => {
      tracker.joinGroup("user1", "group-a");

      tracker.pruneInactiveGroups(new Set(["group-a"]));

      expect(tracker.getContactId("user1")).not.toBeNull();
    });

    it("비활성 그룹을 즉시 제거하지 않아야 함", () => {
      const contactId = tracker.joinGroup("user1", "group-a");

      tracker.pruneInactiveGroups(new Set());

      expect(tracker.getContactId("user1")).toBe(contactId);
    });

    it("INACTIVE_TICKS_TO_EXPIRE 후 그룹을 제거해야 함", () => {
      tracker.joinGroup("user1", "group-a");

      tracker.pruneInactiveGroups(new Set());
      tracker.pruneInactiveGroups(new Set());
      tracker.pruneInactiveGroups(new Set());

      const newContactId = tracker.joinGroup("user2", "group-a");
      const existingContactId = tracker.getContactId("user1");

      expect(newContactId).toBeDefined();
    });

    it("그룹이 다시 활성화되면 inactiveTicks를 초기화해야 함", () => {
      tracker.joinGroup("user1", "group-a");

      tracker.pruneInactiveGroups(new Set());
      tracker.pruneInactiveGroups(new Set());

      tracker.pruneInactiveGroups(new Set(["group-a"]));

      tracker.pruneInactiveGroups(new Set());
      tracker.pruneInactiveGroups(new Set());

      const newUser = tracker.joinGroup("user2", "group-a");
      expect(tracker.getContactId("user1")).toBe(newUser);
    });
  });

  describe("통합 시나리오", () => {
    it("사용자가 그룹 간 이동하는 것을 처리해야 함", () => {
      const contactIdA = tracker.joinGroup("user1", "group-a");
      expect(tracker.getContactId("user1")).toBe(contactIdA);

      const contactIdB = tracker.joinGroup("user1", "group-b");
      expect(tracker.getContactId("user1")).toBe(contactIdB);
      expect(contactIdB).not.toBe(contactIdA);
    });

    it("여러 그룹의 여러 사용자를 처리해야 함", () => {
      tracker.joinGroup("user1", "group-a");
      tracker.joinGroup("user2", "group-a");

      tracker.joinGroup("user3", "group-b");
      tracker.joinGroup("user4", "group-b");

      expect(tracker.getContactId("user1")).toBe(tracker.getContactId("user2"));
      expect(tracker.getContactId("user3")).toBe(tracker.getContactId("user4"));
      expect(tracker.getContactId("user1")).not.toBe(tracker.getContactId("user3"));
    });
  });
});
