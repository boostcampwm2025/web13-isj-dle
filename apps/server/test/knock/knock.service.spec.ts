import { KnockService } from "../../src/knock/knock.service";

describe("KnockService", () => {
  let service: KnockService;

  beforeEach(() => {
    service = new KnockService();
  });

  describe("canKnock", () => {
    it("보내는 사람이 데스크존에 없으면 노크할 수 없어야 함", () => {
      const result = service.canKnock(null, "available");

      expect(result.canKnock).toBe(false);
      expect(result.reason).toBe("데스크존에서만 노크할 수 있습니다.");
    });

    it("받는 사람이 데스크존에 없으면 노크할 수 없어야 함", () => {
      const result = service.canKnock("available", null);

      expect(result.canKnock).toBe(false);
      expect(result.reason).toBe("상대방이 데스크존에 없습니다.");
    });

    it("보내는 사람이 available 상태가 아니면 노크할 수 없어야 함", () => {
      const result = service.canKnock("focusing", "available");

      expect(result.canKnock).toBe(false);
      expect(result.reason).toBe("현재 노크를 보낼 수 없는 상태입니다.");
    });

    it("보내는 사람이 talking 상태면 노크할 수 없어야 함", () => {
      const result = service.canKnock("talking", "available");

      expect(result.canKnock).toBe(false);
      expect(result.reason).toBe("현재 노크를 보낼 수 없는 상태입니다.");
    });

    it("받는 사람이 focusing 상태면 노크할 수 없어야 함", () => {
      const result = service.canKnock("available", "focusing");

      expect(result.canKnock).toBe(false);
      expect(result.reason).toBe("상대방이 집중 중입니다.");
    });

    it("받는 사람이 talking 상태면 노크할 수 없어야 함", () => {
      const result = service.canKnock("available", "talking");

      expect(result.canKnock).toBe(false);
      expect(result.reason).toBe("상대방이 대화 중입니다.");
    });

    it("둘 다 available 상태면 노크할 수 있어야 함", () => {
      const result = service.canKnock("available", "available");

      expect(result.canKnock).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  describe("pendingKnock 관리", () => {
    const knock = {
      fromUserId: "user1",
      fromUserNickname: "닉네임1",
      timestamp: Date.now(),
    };

    it("대기 중인 노크를 추가할 수 있어야 함", () => {
      service.addPendingKnock(knock, "user2");

      expect(service.hasPendingKnock("user1", "user2")).toBe(true);
    });

    it("대기 중인 노크가 없으면 false를 반환해야 함", () => {
      expect(service.hasPendingKnock("user1", "user2")).toBe(false);
    });

    it("대기 중인 노크를 조회할 수 있어야 함", () => {
      service.addPendingKnock(knock, "user2");

      const result = service.getPendingKnock("user1", "user2");

      expect(result).toEqual(knock);
    });

    it("존재하지 않는 노크 조회 시 undefined를 반환해야 함", () => {
      const result = service.getPendingKnock("user1", "user2");

      expect(result).toBeUndefined();
    });

    it("대기 중인 노크를 삭제할 수 있어야 함", () => {
      service.addPendingKnock(knock, "user2");

      service.removePendingKnock("user1", "user2");

      expect(service.hasPendingKnock("user1", "user2")).toBe(false);
    });
  });

  describe("removeAllKnocksForUser", () => {
    it("사용자가 보낸 모든 노크를 삭제해야 함", () => {
      const knock1 = { fromUserId: "user1", fromUserNickname: "닉네임1", timestamp: Date.now() };
      service.addPendingKnock(knock1, "user2");
      service.addPendingKnock(knock1, "user3");

      const result = service.removeAllKnocksForUser("user1");

      expect(result.sentTo).toContain("user2");
      expect(result.sentTo).toContain("user3");
      expect(service.hasPendingKnock("user1", "user2")).toBe(false);
      expect(service.hasPendingKnock("user1", "user3")).toBe(false);
    });

    it("사용자가 받은 모든 노크를 삭제해야 함", () => {
      const knock1 = { fromUserId: "user2", fromUserNickname: "닉네임2", timestamp: Date.now() };
      const knock2 = { fromUserId: "user3", fromUserNickname: "닉네임3", timestamp: Date.now() };
      service.addPendingKnock(knock1, "user1");
      service.addPendingKnock(knock2, "user1");

      const result = service.removeAllKnocksForUser("user1");

      expect(result.receivedFrom).toContain("user2");
      expect(result.receivedFrom).toContain("user3");
      expect(service.hasPendingKnock("user2", "user1")).toBe(false);
      expect(service.hasPendingKnock("user3", "user1")).toBe(false);
    });

    it("관련 없는 노크는 유지되어야 함", () => {
      const knock1 = { fromUserId: "user2", fromUserNickname: "닉네임2", timestamp: Date.now() };
      service.addPendingKnock(knock1, "user3");

      service.removeAllKnocksForUser("user1");

      expect(service.hasPendingKnock("user2", "user3")).toBe(true);
    });
  });

  describe("talkingPair 관리", () => {
    it("대화 쌍을 추가할 수 있어야 함", () => {
      service.addTalkingPair("user1", "user2");

      expect(service.getTalkingPartner("user1")).toBe("user2");
      expect(service.getTalkingPartner("user2")).toBe("user1");
    });

    it("대화 상대가 없으면 undefined를 반환해야 함", () => {
      expect(service.getTalkingPartner("user1")).toBeUndefined();
    });

    it("대화 쌍을 삭제하면 양쪽 모두 삭제되어야 함", () => {
      service.addTalkingPair("user1", "user2");

      const partnerId = service.removeTalkingPair("user1");

      expect(partnerId).toBe("user2");
      expect(service.getTalkingPartner("user1")).toBeUndefined();
      expect(service.getTalkingPartner("user2")).toBeUndefined();
    });

    it("대화 상대가 없는 상태에서 삭제 시 undefined를 반환해야 함", () => {
      const partnerId = service.removeTalkingPair("user1");

      expect(partnerId).toBeUndefined();
    });
  });
});
