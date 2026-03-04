import { KnockEventType } from "@shared/types";
import type { User } from "@shared/types";
import "reflect-metadata";
import type { Socket } from "socket.io";

import { KnockGateway } from "../../src/knock/knock.gateway";
import { KnockService } from "../../src/knock/knock.service";
import { type UserService } from "../../src/user/user.service";

jest.mock("../../src/user/user.service");

function createUserSession(socketId: string, deskStatus: "available" | "focusing" | "talking" | null): User {
  return {
    socketId,
    userId: 1,
    contactId: null,
    nickname: `User_${socketId}`,
    cameraOn: false,
    micOn: false,
    avatar: {
      x: 0,
      y: 0,
      currentRoomId: "desk zone",
      direction: "down",
      state: "idle",
      assetKey: "ADAM",
    },
    deskStatus,
  };
}

function createMockSocket(socketId: string): Socket {
  return { id: socketId, emit: jest.fn() } as unknown as Socket;
}

function createMockServer() {
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  return { to, emit, _childEmit: emit };
}

describe("KnockGateway", () => {
  let gateway: KnockGateway;
  let knockService: KnockService;
  let mockUserService: jest.Mocked<
    Pick<UserService, "getSession" | "updateSessionDeskStatus" | "updateSessionContactId">
  >;
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    knockService = new KnockService();

    mockUserService = {
      getSession: jest.fn(),
      updateSessionDeskStatus: jest.fn().mockReturnValue(true),
      updateSessionContactId: jest.fn().mockReturnValue(true),
    };

    mockServer = createMockServer();

    gateway = new KnockGateway(knockService, mockUserService as unknown as UserService);
    (gateway as unknown as { server: typeof mockServer }).server = mockServer;
  });

  afterEach(() => jest.clearAllMocks());

  describe("handleKnockAccept - 정상 흐름", () => {
    it("A→B 수락 성공: talkingPair 등록, KNOCK_ACCEPT_SUCCESS 전송", () => {
      const userA = createUserSession("A", "available");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");

      const clientB = createMockSocket("B");
      gateway.handleKnockAccept(clientB, { fromSocketId: "A" });

      expect(clientB.emit).toHaveBeenCalledWith(
        KnockEventType.KNOCK_ACCEPT_SUCCESS,
        expect.objectContaining({ fromSocketId: "A" }),
      );
      expect(knockService.getTalkingPartner("B")).toBe("A");
      expect(knockService.getTalkingPartner("A")).toBe("B");
    });

    it("수락 후 pending knock 삭제됨", () => {
      const userA = createUserSession("A", "available");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");

      gateway.handleKnockAccept(createMockSocket("B"), { fromSocketId: "A" });

      expect(knockService.hasPendingKnock("A", "B")).toBe(false);
    });
  });

  describe("handleKnockAccept - 발신자(fromUser) 상태 검증", () => {
    it("fromUser talking → KNOCK_ACCEPT_FAILED", () => {
      const userA = createUserSession("A", "talking");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");

      const clientB = createMockSocket("B");
      gateway.handleKnockAccept(clientB, { fromSocketId: "A" });

      expect(clientB.emit).toHaveBeenCalledWith(
        KnockEventType.KNOCK_ACCEPT_FAILED,
        expect.objectContaining({ reason: expect.stringContaining("다른 대화") }),
      );
    });

    it("fromUser focusing → KNOCK_ACCEPT_FAILED", () => {
      const userA = createUserSession("A", "focusing");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");

      const clientB = createMockSocket("B");
      gateway.handleKnockAccept(clientB, { fromSocketId: "A" });

      expect(clientB.emit).toHaveBeenCalledWith(KnockEventType.KNOCK_ACCEPT_FAILED, expect.any(Object));
    });

    it("pending knock 없음 → KNOCK_ACCEPT_FAILED", () => {
      const userA = createUserSession("A", "available");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );

      const clientB = createMockSocket("B");
      gateway.handleKnockAccept(clientB, { fromSocketId: "A" });

      expect(clientB.emit).toHaveBeenCalledWith(
        KnockEventType.KNOCK_ACCEPT_FAILED,
        expect.objectContaining({ reason: expect.stringContaining("찾을 수 없습니다") }),
      );
    });

    it("fromUser 접속 해제됨(undefined) → KNOCK_ACCEPT_FAILED", () => {
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation((id) => {
        if (id === "A") return undefined;
        if (id === "B") return userB;
      });

      const clientB = createMockSocket("B");
      gateway.handleKnockAccept(clientB, { fromSocketId: "A" });

      expect(clientB.emit).toHaveBeenCalledWith(KnockEventType.KNOCK_ACCEPT_FAILED, expect.any(Object));
    });
  });

  describe("[Bug-1] toUser(수락자) 상태 미검증 재현", () => {
    it("[버그 재현] talking 상태인 B가 또 다른 노크를 수락하면 막혀야 하지만 통과됨", () => {
      const userA = createUserSession("A", "available");
      const userB = createUserSession("B", "talking");
      const userC = createUserSession("C", "talking");

      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB, C: userC }) as Partial<Record<string, User>>)[id],
      );
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      knockService.addTalkingPair("B", "C");

      const clientB = createMockSocket("B");
      gateway.handleKnockAccept(clientB, { fromSocketId: "A" });

      expect(clientB.emit).toHaveBeenCalledWith(
        KnockEventType.KNOCK_ACCEPT_FAILED,
        expect.objectContaining({ reason: expect.any(String) }),
      );
      expect(knockService.getTalkingPartner("A")).toBeUndefined();
    });

    it("[버그 결과] talkingPairs 상태 오염 확인: B-C 덮어씌워져 C가 방치됨", () => {
      const userA = createUserSession("A", "available");
      const userB = createUserSession("B", "talking");
      const userC = createUserSession("C", "talking");

      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB, C: userC }) as Partial<Record<string, User>>)[id],
      );
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      knockService.addTalkingPair("B", "C");

      gateway.handleKnockAccept(createMockSocket("B"), { fromSocketId: "A" });

      const bPartner = knockService.getTalkingPartner("B");
      const cPartner = knockService.getTalkingPartner("C");

      if (bPartner === "A") {
        expect(cPartner).toBe("B");
      }
    });
  });

  describe("handleKnockAccept - 교차 노크 정리", () => {
    it("A→B와 B→A 교차 노크 시 B가 A 수락 → B→A 역방향 knock 정리됨", () => {
      const userA = createUserSession("A", "available");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");
      knockService.addPendingKnock({ fromSocketId: "B", fromUserNickname: "B", timestamp: 1 }, "A");

      gateway.handleKnockAccept(createMockSocket("B"), { fromSocketId: "A" });

      expect(knockService.hasPendingKnock("B", "A")).toBe(false);
    });
  });

  describe("handleKnockSend", () => {
    it("양쪽 available → 노크 등록, 수신자에게 KNOCK_RECEIVED 전송", () => {
      const userA = createUserSession("A", "available");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );

      gateway.handleKnockSend(createMockSocket("A"), { targetSocketId: "B" });

      expect(knockService.hasPendingKnock("A", "B")).toBe(true);
      expect(mockServer.to).toHaveBeenCalledWith("B");
    });

    it("발신자 focusing → error, knock 등록 안됨", () => {
      const userA = createUserSession("A", "focusing");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );

      const clientA = createMockSocket("A");
      gateway.handleKnockSend(clientA, { targetSocketId: "B" });

      expect(clientA.emit).toHaveBeenCalledWith("error", expect.any(Object));
      expect(knockService.hasPendingKnock("A", "B")).toBe(false);
    });

    it("중복 노크 → error", () => {
      const userA = createUserSession("A", "available");
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation(
        (id) => (({ A: userA, B: userB }) as Partial<Record<string, User>>)[id],
      );
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");

      const clientA = createMockSocket("A");
      gateway.handleKnockSend(clientA, { targetSocketId: "B" });

      expect(clientA.emit).toHaveBeenCalledWith(
        "error",
        expect.objectContaining({ message: expect.stringContaining("이미") }),
      );
    });
  });

  describe("handleUserDisconnecting", () => {
    it("대화 중 접속 해제 → 파트너에게 to() 호출됨 (TALK_ENDED 전송)", () => {
      const userB = createUserSession("B", "talking");
      mockUserService.getSession.mockImplementation((id) => (id === "B" ? userB : undefined));
      knockService.addTalkingPair("A", "B");

      gateway.handleUserDisconnecting({ clientId: "A", nickname: "UserA" });

      expect(mockServer.to).toHaveBeenCalledWith("B");
    });

    it("보낸 노크 pending 중 접속 해제 → 수신자에게 to() 호출됨", () => {
      const userB = createUserSession("B", "available");
      mockUserService.getSession.mockImplementation((id) => (id === "B" ? userB : undefined));
      knockService.addPendingKnock({ fromSocketId: "A", fromUserNickname: "A", timestamp: 0 }, "B");

      gateway.handleUserDisconnecting({ clientId: "A", nickname: "UserA" });

      expect(mockServer.to).toHaveBeenCalledWith("B");
    });

    it("받은 노크 pending 중 접속 해제 → 발신자에게 to() 호출됨", () => {
      mockUserService.getSession.mockReturnValue(undefined);
      knockService.addPendingKnock({ fromSocketId: "B", fromUserNickname: "B", timestamp: 0 }, "A");

      gateway.handleUserDisconnecting({ clientId: "A", nickname: "UserA" });

      expect(mockServer.to).toHaveBeenCalledWith("B");
    });
  });
});
