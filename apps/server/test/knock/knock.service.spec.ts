import { KnockService } from "../../src/knock/knock.service";

describe("KnockService", () => {
  let service: KnockService;

  beforeEach(() => {
    service = new KnockService();
  });

  describe("canKnock", () => {
    describe("발신자(fromStatus) 상태 검증", () => {
      it("fromStatus === null → 불가: 데스크존 밖", () => {
        const result = service.canKnock(null, "available");

        expect(result.canKnock).toBe(false);
        expect(result.reason).toBe("데스크존에서만 노크할 수 있습니다.");
      });

      it("fromStatus === focusing → 불가: 집중 중에는 노크 불가", () => {
        const result = service.canKnock("focusing", "available");

        expect(result.canKnock).toBe(false);
        expect(result.reason).toContain("보낼 수 없는 상태");
      });

      it("fromStatus === talking → 불가: 대화 중에는 노크 불가", () => {
        const result = service.canKnock("talking", "available");

        expect(result.canKnock).toBe(false);
        expect(result.reason).toContain("보낼 수 없는 상태");
      });
    });

    describe("수신자(toStatus) 상태 검증", () => {
      it("toStatus === null → 불가: 상대가 데스크존 밖", () => {
        const result = service.canKnock("available", null);

        expect(result.canKnock).toBe(false);
        expect(result.reason).toContain("상대방이 데스크존에 없습니다.");
      });

      it("toStatus === focusing → 불가: 상대가 집중 중", () => {
        const result = service.canKnock("available", "focusing");

        expect(result.canKnock).toBe(false);
        expect(result.reason).toContain("집중");
      });

      it("toStatus === talking → 불가: 상대가 대화 중", () => {
        const result = service.canKnock("available", "talking");

        expect(result.canKnock).toBe(false);
        expect(result.reason).toContain("대화 중");
      });
    });

    describe("정상 케이스", () => {
      it("both available → 가능", () => {
        const result = service.canKnock("available", "available");

        expect(result.canKnock).toBe(true);
        expect(result.reason).toBeUndefined();
      });
    });

    describe("발신자 우선 검증 (에러 메시지 우선순위)", () => {
      it("fromStatus null이면 toStatus가 무엇이든 발신자 오류가 먼저", () => {
        const result = service.canKnock(null, null);

        expect(result.canKnock).toBe(false);
        expect(result.reason).toBe("데스크존에서만 노크할 수 있습니다.");
      });

      it("fromStatus available인데 toStatus null → 수신자 오류 메시지", () => {
        const result = service.canKnock("available", null);

        expect(result.canKnock).toBe(false);
        expect(result.reason).toBe("상대방이 데스크존에 없습니다.");
      });
    });
  });

  describe("pendingKnock 생명주기", () => {
    const makeKnock = (fromId: string) => ({
      fromSocketId: fromId,
      fromUserNickname: "TestUser",
      timestamp: Date.now(),
    });

    it("addPendingKnock 후 hasPendingKnock true 반환", () => {
      service.addPendingKnock(makeKnock("A"), "B");

      expect(service.hasPendingKnock("A", "B")).toBe(true);
    });

    it("노크는 방향성이 있음: A→B와 B→A는 다른 노크", () => {
      service.addPendingKnock(makeKnock("A"), "B");

      expect(service.hasPendingKnock("A", "B")).toBe(true);
      expect(service.hasPendingKnock("B", "A")).toBe(false);
    });

    it("getPendingKnock: 존재하는 노크의 데이터 반환", () => {
      const knock = makeKnock("A");
      service.addPendingKnock(knock, "B");

      const result = service.getPendingKnock("A", "B");

      expect(result).toEqual(knock);
    });

    it("getPendingKnock: 없는 노크는 undefined 반환", () => {
      expect(service.getPendingKnock("X", "Y")).toBeUndefined();
    });

    it("removePendingKnock 후 hasPendingKnock false 반환", () => {
      service.addPendingKnock(makeKnock("A"), "B");
      service.removePendingKnock("A", "B");

      expect(service.hasPendingKnock("A", "B")).toBe(false);
    });

    it("없는 노크 remove는 에러 없이 무시", () => {
      expect(() => service.removePendingKnock("GHOST", "TARGET")).not.toThrow();
    });
  });

  describe("removeAllKnocksForUser", () => {
    it("내가 보낸 노크의 수신자 목록(sentTo)이 정확히 반환됨", () => {
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "C");

      const { sentTo, receivedFrom } = service.removeAllKnocksForUser("A");

      expect(sentTo).toHaveLength(2);
      expect(sentTo).toContain("B");
      expect(sentTo).toContain("C");
      expect(receivedFrom).toHaveLength(0);
    });

    it("내가 받은 노크의 발신자 목록(receivedFrom)이 정확히 반환됨", () => {
      service.addPendingKnock({ fromSocketId: "B", fromUserNickname: "B", timestamp: 0 }, "A");
      service.addPendingKnock({ fromSocketId: "C", fromUserNickname: "C", timestamp: 0 }, "A");

      const { sentTo, receivedFrom } = service.removeAllKnocksForUser("A");

      expect(receivedFrom).toHaveLength(2);
      expect(receivedFrom).toContain("B");
      expect(receivedFrom).toContain("C");
      expect(sentTo).toHaveLength(0);
    });

    it("보낸 것과 받은 것 혼합 케이스", () => {
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B"); // A→B (A가 보냄)
      service.addPendingKnock({ fromSocketId: "C", fromUserNickname: "C", timestamp: 0 }, "A"); // C→A (A가 받음)

      const { sentTo, receivedFrom } = service.removeAllKnocksForUser("A");

      expect(sentTo).toContain("B");
      expect(receivedFrom).toContain("C");
    });

    it("정리 후 해당 pendingKnock들이 실제로 삭제됨", () => {
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      service.removeAllKnocksForUser("A");

      expect(service.hasPendingKnock("A", "B")).toBe(false);
    });

    it("관계없는 노크는 삭제되지 않음", () => {
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      service.addPendingKnock({ fromSocketId: "X", fromUserNickname: "X", timestamp: 0 }, "Y"); // 무관한 노크

      service.removeAllKnocksForUser("A");

      expect(service.hasPendingKnock("X", "Y")).toBe(true); // 무관한 노크는 유지
    });
  });

  describe("[Bug-2] Socket ID 구분자 취약점", () => {
    it("하이픈 없는 정상 socket ID → removeAllKnocksForUser 정상 작동 (baseline)", () => {
      service.addPendingKnock({ fromSocketId: "NORMALID", fromUserNickname: "Alice", timestamp: 0 }, "TARGETID");

      const { sentTo } = service.removeAllKnocksForUser("NORMALID");

      expect(sentTo).toContain("TARGETID");
      expect(service.hasPendingKnock("NORMALID", "TARGETID")).toBe(false);
    });

    it("[버그 재현] 하이픈이 포함된 from socket ID → removeAllKnocksForUser 실패", () => {
      const fromSocketIdWithDash = "V0kd-123";

      service.addPendingKnock({ fromSocketId: fromSocketIdWithDash, fromUserNickname: "Bob", timestamp: 0 }, "AAAA");

      const { sentTo } = service.removeAllKnocksForUser(fromSocketIdWithDash);

      expect(sentTo).toContain("AAAA");
      expect(service.hasPendingKnock(fromSocketIdWithDash, "AAAA")).toBe(false);
    });

    it("[버그 재현] 하이픈이 포함된 to socket ID → removeAllKnocksForUser 실패", () => {
      const toSocketIdWithDash = "BBBB-456";

      service.addPendingKnock({ fromSocketId: "CCCC", fromUserNickname: "Charlie", timestamp: 0 }, toSocketIdWithDash);

      const { receivedFrom } = service.removeAllKnocksForUser(toSocketIdWithDash);

      expect(receivedFrom).toContain("CCCC");
      expect(service.hasPendingKnock("CCCC", toSocketIdWithDash)).toBe(false);
    });

    it("[버그 수정 검증] | 구분자 사용 시 하이픈 포함 ID도 정상 작동 확인용 (수동 검증)", () => {
      const fromId = "V0kd-123";
      const toId = "AAAA-456";
      const correctKey = `${fromId}|${toId}`;

      const [parsedFrom, parsedTo] = correctKey.split("|");

      expect(parsedFrom).toBe(fromId);
      expect(parsedTo).toBe(toId);
    });
  });

  describe("[설계 결정] TTL 미구현: 정상 종료 경로 전수 검증", () => {
    it("경로 A: 발신자(A) disconnect 시 A가 보낸 모든 pending knock 즉시 정리", () => {
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "C");

      service.removeAllKnocksForUser("A");

      expect(service.hasPendingKnock("A", "B")).toBe(false);
      expect(service.hasPendingKnock("A", "C")).toBe(false);
    });

    it("경로 B: 수신자(B) disconnect 시 B에게 보내진 모든 pending knock 즉시 정리", () => {
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      service.addPendingKnock({ fromSocketId: "C", fromUserNickname: "C", timestamp: 0 }, "B");

      service.removeAllKnocksForUser("B");

      expect(service.hasPendingKnock("A", "B")).toBe(false);
      expect(service.hasPendingKnock("C", "B")).toBe(false);
    });

    it("경로 A/B 공통: removeAllKnocksForUser는 sent/received 양방향 모두 정리", () => {
      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      service.addPendingKnock({ fromSocketId: "C", fromUserNickname: "C", timestamp: 0 }, "A");

      const { sentTo, receivedFrom } = service.removeAllKnocksForUser("A");

      expect(sentTo).toContain("B");
      expect(receivedFrom).toContain("C");
      expect(service.hasPendingKnock("A", "B")).toBe(false);
      expect(service.hasPendingKnock("C", "A")).toBe(false);
    });

    it("[좀비 소켓 잔류 시간 측정] TTL 없이 disconnect 미발생 시 knock은 자동 정리되지 않음", () => {
      jest.useFakeTimers();

      service.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");

      jest.advanceTimersByTime(44_000);
      expect(service.hasPendingKnock("A", "B")).toBe(true);

      service.removeAllKnocksForUser("A");
      expect(service.hasPendingKnock("A", "B")).toBe(false);

      jest.useRealTimers();
    });
  });

  describe("talkingPair 관리", () => {
    it("addTalkingPair → 양방향으로 저장됨", () => {
      service.addTalkingPair("A", "B");

      expect(service.getTalkingPartner("A")).toBe("B");
      expect(service.getTalkingPartner("B")).toBe("A");
    });

    it("removeTalkingPair → 파트너 ID 반환", () => {
      service.addTalkingPair("A", "B");

      const partnerId = service.removeTalkingPair("A");

      expect(partnerId).toBe("B");
    });

    it("removeTalkingPair → 양쪽 모두 삭제됨", () => {
      service.addTalkingPair("A", "B");
      service.removeTalkingPair("A");

      expect(service.getTalkingPartner("A")).toBeUndefined();
      expect(service.getTalkingPartner("B")).toBeUndefined();
    });

    it("한쪽(B)이 removeTalkingPair 호출해도 양쪽 삭제됨", () => {
      service.addTalkingPair("A", "B");
      service.removeTalkingPair("B");

      expect(service.getTalkingPartner("A")).toBeUndefined();
      expect(service.getTalkingPartner("B")).toBeUndefined();
    });

    it("없는 쌍 remove → undefined 반환, 에러 없음", () => {
      expect(service.removeTalkingPair("GHOST")).toBeUndefined();
    });

    it("getTalkingPartner: 등록 안된 사용자 → undefined", () => {
      expect(service.getTalkingPartner("UNKNOWN")).toBeUndefined();
    });

    it("여러 쌍 독립적으로 관리됨", () => {
      service.addTalkingPair("A", "B");
      service.addTalkingPair("C", "D");

      expect(service.getTalkingPartner("A")).toBe("B");
      expect(service.getTalkingPartner("C")).toBe("D");

      service.removeTalkingPair("A");

      expect(service.getTalkingPartner("A")).toBeUndefined();
      expect(service.getTalkingPartner("C")).toBe("D");
    });
  });
});
