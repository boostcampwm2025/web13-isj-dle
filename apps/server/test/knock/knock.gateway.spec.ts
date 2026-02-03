import { KnockEventType, UserEventType } from "@shared/types";
import { type Server, type Socket } from "socket.io";

import { KnockGateway } from "../../src/knock/knock.gateway";
import { type KnockService } from "../../src/knock/knock.service";
import { type UserService } from "../../src/user/user.service";

describe("KnockGateway", () => {
  let gateway: KnockGateway;
  let knockService: jest.Mocked<KnockService>;
  let userService: jest.Mocked<UserService>;
  let mockServer: jest.Mocked<Server>;

  const createMockSocket = (id: string): jest.Mocked<Socket> =>
    ({
      id,
      emit: jest.fn(),
    }) as unknown as jest.Mocked<Socket>;

  const createMockUser = (id: string, overrides = {}) => ({
    id,
    nickname: `닉네임_${id}`,
    deskStatus: "available" as const,
    avatar: { currentRoomId: "desk zone" },
    ...overrides,
  });

  beforeEach(() => {
    knockService = {
      canKnock: jest.fn().mockReturnValue({ canKnock: true }),
      hasPendingKnock: jest.fn().mockReturnValue(false),
      addPendingKnock: jest.fn(),
      removePendingKnock: jest.fn(),
      getPendingKnock: jest.fn(),
      removeAllKnocksForUser: jest.fn().mockReturnValue({ sentTo: [], receivedFrom: [] }),
      addTalkingPair: jest.fn(),
      removeTalkingPair: jest.fn(),
      getTalkingPartner: jest.fn(),
    } as unknown as jest.Mocked<KnockService>;

    userService = {
      getSession: jest.fn(),
      updateSessionDeskStatus: jest.fn(),
      updateSessionContactId: jest.fn(),
      getRoomSessions: jest.fn().mockReturnValue([]),
    } as unknown as jest.Mocked<UserService>;

    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Server>;

    gateway = new KnockGateway(knockService, userService);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleKnockSend", () => {
    it("노크를 성공적으로 보내야 함", () => {
      const mockSocket = createMockSocket("user1");
      const fromUser = createMockUser("user1");
      const toUser = createMockUser("user2");

      userService.getSession.mockReturnValueOnce(fromUser as never).mockReturnValueOnce(toUser as never);

      gateway.handleKnockSend(mockSocket, { targetUserId: "user2" });

      expect(knockService.addPendingKnock).toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith("user2");
      expect(mockServer.emit).toHaveBeenCalledWith(
        KnockEventType.KNOCK_RECEIVED,
        expect.objectContaining({
          fromUserId: "user1",
          fromUserNickname: fromUser.nickname,
        }),
      );
    });

    it("보내는 사람이 없으면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");
      userService.getSession.mockReturnValue(undefined);

      gateway.handleKnockSend(mockSocket, { targetUserId: "user2" });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "사용자를 찾을 수 없습니다." });
      expect(knockService.addPendingKnock).not.toHaveBeenCalled();
    });

    it("받는 사람이 없으면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");
      const fromUser = createMockUser("user1");

      userService.getSession.mockReturnValueOnce(fromUser as never).mockReturnValueOnce(undefined);

      gateway.handleKnockSend(mockSocket, { targetUserId: "user2" });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "사용자를 찾을 수 없습니다." });
    });

    it("노크할 수 없는 상태면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");
      const fromUser = createMockUser("user1", { deskStatus: "focusing" });
      const toUser = createMockUser("user2");

      userService.getSession.mockReturnValueOnce(fromUser as never).mockReturnValueOnce(toUser as never);
      knockService.canKnock.mockReturnValue({ canKnock: false, reason: "현재 노크를 보낼 수 없는 상태입니다." });

      gateway.handleKnockSend(mockSocket, { targetUserId: "user2" });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", {
        message: "현재 노크를 보낼 수 없는 상태입니다.",
      });
    });

    it("이미 대기 중인 노크가 있으면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");
      const fromUser = createMockUser("user1");
      const toUser = createMockUser("user2");

      userService.getSession.mockReturnValueOnce(fromUser as never).mockReturnValueOnce(toUser as never);
      knockService.hasPendingKnock.mockReturnValue(true);

      gateway.handleKnockSend(mockSocket, { targetUserId: "user2" });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "이미 노크 요청을 보냈습니다." });
    });
  });

  describe("handleKnockAccept", () => {
    it("노크를 수락하면 대화가 시작되어야 함", () => {
      const mockSocket = createMockSocket("user2");
      const toUser = createMockUser("user2");
      const fromUser = createMockUser("user1");
      const knock = { fromUserId: "user1", fromUserNickname: "닉네임_user1", timestamp: Date.now() };

      userService.getSession.mockReturnValueOnce(toUser as never).mockReturnValueOnce(fromUser as never);
      knockService.getPendingKnock.mockReturnValue(knock);

      gateway.handleKnockAccept(mockSocket, { fromUserId: "user1" });

      expect(knockService.removePendingKnock).toHaveBeenCalledWith("user1", "user2");
      expect(userService.updateSessionDeskStatus).toHaveBeenCalledWith("user2", "talking");
      expect(userService.updateSessionDeskStatus).toHaveBeenCalledWith("user1", "talking");
      expect(knockService.addTalkingPair).toHaveBeenCalledWith("user2", "user1");
      expect(mockServer.to).toHaveBeenCalledWith("user1");
      expect(mockServer.emit).toHaveBeenCalledWith(
        KnockEventType.KNOCK_ACCEPTED,
        expect.objectContaining({ status: "accepted" }),
      );
    });

    it("상대방이 없으면 수락 실패해야 함", () => {
      const mockSocket = createMockSocket("user2");
      const toUser = createMockUser("user2");

      userService.getSession.mockReturnValueOnce(toUser as never).mockReturnValueOnce(undefined);

      gateway.handleKnockAccept(mockSocket, { fromUserId: "user1" });

      expect(mockSocket.emit).toHaveBeenCalledWith(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromUserId: "user1",
        reason: "사용자를 찾을 수 없습니다.",
      });
    });

    it("대기 중인 노크가 없으면 수락 실패해야 함", () => {
      const mockSocket = createMockSocket("user2");
      const toUser = createMockUser("user2");
      const fromUser = createMockUser("user1");

      userService.getSession.mockReturnValueOnce(toUser as never).mockReturnValueOnce(fromUser as never);
      knockService.getPendingKnock.mockReturnValue(undefined);

      gateway.handleKnockAccept(mockSocket, { fromUserId: "user1" });

      expect(mockSocket.emit).toHaveBeenCalledWith(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromUserId: "user1",
        reason: "노크 요청을 찾을 수 없습니다.",
      });
    });

    it("상대방이 이미 대화 중이면 수락 실패해야 함", () => {
      const mockSocket = createMockSocket("user2");
      const toUser = createMockUser("user2");
      const fromUser = createMockUser("user1", { deskStatus: "talking" });
      const knock = { fromUserId: "user1", fromUserNickname: "닉네임_user1", timestamp: Date.now() };

      userService.getSession.mockReturnValueOnce(toUser as never).mockReturnValueOnce(fromUser as never);
      knockService.getPendingKnock.mockReturnValue(knock);

      gateway.handleKnockAccept(mockSocket, { fromUserId: "user1" });

      expect(mockSocket.emit).toHaveBeenCalledWith(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromUserId: "user1",
        reason: "상대방이 이미 다른 대화 중입니다.",
      });
    });

    it("쌍방 노크가 있으면 한쪽이 취소되어야 함", () => {
      const mockSocket = createMockSocket("user2");
      const toUser = createMockUser("user2");
      const fromUser = createMockUser("user1");
      const knock = { fromUserId: "user1", fromUserNickname: "닉네임_user1", timestamp: Date.now() };

      userService.getSession.mockReturnValueOnce(toUser as never).mockReturnValueOnce(fromUser as never);
      knockService.getPendingKnock.mockReturnValue(knock);
      knockService.hasPendingKnock.mockReturnValue(true);

      gateway.handleKnockAccept(mockSocket, { fromUserId: "user1" });

      expect(knockService.removePendingKnock).toHaveBeenCalledWith("user2", "user1");
      expect(mockServer.emit).toHaveBeenCalledWith(KnockEventType.KNOCK_CANCELLED, {
        fromUserId: "user2",
      });
    });
  });

  describe("handleKnockReject", () => {
    it("노크를 거절해야 함", () => {
      const mockSocket = createMockSocket("user2");
      const toUser = createMockUser("user2");
      const fromUser = createMockUser("user1");

      userService.getSession.mockReturnValueOnce(toUser as never).mockReturnValueOnce(fromUser as never);

      gateway.handleKnockReject(mockSocket, { fromUserId: "user1" });

      expect(knockService.removePendingKnock).toHaveBeenCalledWith("user1", "user2");
      expect(mockServer.to).toHaveBeenCalledWith("user1");
      expect(mockServer.emit).toHaveBeenCalledWith(
        KnockEventType.KNOCK_REJECTED,
        expect.objectContaining({ status: "rejected" }),
      );
    });

    it("보낸 사람이 없어도 노크를 삭제해야 함", () => {
      const mockSocket = createMockSocket("user2");

      userService.getSession.mockReturnValue(undefined);

      gateway.handleKnockReject(mockSocket, { fromUserId: "user1" });

      expect(knockService.removePendingKnock).toHaveBeenCalledWith("user1", "user2");
    });
  });

  describe("handleDeskStatusUpdate", () => {
    it("데스크 상태를 업데이트해야 함", () => {
      const mockSocket = createMockSocket("user1");
      const user = createMockUser("user1");

      userService.getSession.mockReturnValue(user as never);

      gateway.handleDeskStatusUpdate(mockSocket, { status: "focusing" });

      expect(userService.updateSessionDeskStatus).toHaveBeenCalledWith("user1", "focusing");
      expect(mockServer.to).toHaveBeenCalledWith("desk zone");
      expect(mockServer.emit).toHaveBeenCalledWith(KnockEventType.DESK_STATUS_UPDATED, {
        userId: "user1",
        status: "focusing",
      });
    });

    it("세션이 없으면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");
      userService.getSession.mockReturnValue(undefined);

      gateway.handleDeskStatusUpdate(mockSocket, { status: "focusing" });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "사용자를 찾을 수 없습니다." });
    });

    it("대화 중일 때 상태 변경을 막아야 함", () => {
      const mockSocket = createMockSocket("user1");
      const user = createMockUser("user1", { deskStatus: "talking" });

      userService.getSession.mockReturnValue(user as never);

      gateway.handleDeskStatusUpdate(mockSocket, { status: "available" });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", {
        message: "대화 중에는 상태를 변경할 수 없습니다. 대화를 종료해주세요.",
      });
      expect(userService.updateSessionDeskStatus).not.toHaveBeenCalled();
    });
  });

  describe("handleTalkEnd", () => {
    it("대화를 종료해야 함", () => {
      const mockSocket = createMockSocket("user1");
      const user = createMockUser("user1", { deskStatus: "talking" });
      const partner = createMockUser("user2", { deskStatus: "talking" });

      userService.getSession.mockReturnValueOnce(user as never).mockReturnValueOnce(partner as never);
      knockService.getTalkingPartner.mockReturnValue("user2");

      gateway.handleTalkEnd(mockSocket);

      expect(knockService.removeTalkingPair).toHaveBeenCalledWith("user1");
      expect(userService.updateSessionDeskStatus).toHaveBeenCalledWith("user1", "available");
      expect(userService.updateSessionDeskStatus).toHaveBeenCalledWith("user2", "available");
      expect(userService.updateSessionContactId).toHaveBeenCalledWith("user1", null);
      expect(userService.updateSessionContactId).toHaveBeenCalledWith("user2", null);
      expect(mockServer.emit).toHaveBeenCalledWith(
        KnockEventType.TALK_ENDED,
        expect.objectContaining({ reason: "ended_by_user" }),
      );
    });

    it("세션이 없으면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");
      userService.getSession.mockReturnValue(undefined);

      gateway.handleTalkEnd(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "사용자를 찾을 수 없습니다." });
    });

    it("대화 중이 아니면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");
      const user = createMockUser("user1", { deskStatus: "available" });

      userService.getSession.mockReturnValue(user as never);

      gateway.handleTalkEnd(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "현재 대화 중이 아닙니다." });
    });

    it("대화 상대를 찾을 수 없으면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");
      const user = createMockUser("user1", { deskStatus: "talking" });

      userService.getSession.mockReturnValue(user as never);
      knockService.getTalkingPartner.mockReturnValue(undefined);

      gateway.handleTalkEnd(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "대화 상대를 찾을 수 없습니다." });
    });
  });

  describe("handleUserDisconnecting", () => {
    it("연결 해제 시 대화를 종료해야 함", () => {
      const partner = createMockUser("user2", { deskStatus: "talking" });

      knockService.removeTalkingPair.mockReturnValue("user2");
      userService.getSession.mockReturnValue(partner as never);

      gateway.handleUserDisconnecting({ clientId: "user1", nickname: "닉네임_user1" });

      expect(userService.updateSessionDeskStatus).toHaveBeenCalledWith("user2", "available");
      expect(userService.updateSessionContactId).toHaveBeenCalledWith("user2", null);
      expect(mockServer.emit).toHaveBeenCalledWith(
        KnockEventType.TALK_ENDED,
        expect.objectContaining({ reason: "disconnected" }),
      );
    });

    it("연결 해제 시 보낸 노크를 취소해야 함", () => {
      knockService.removeAllKnocksForUser.mockReturnValue({
        sentTo: ["user2", "user3"],
        receivedFrom: [],
      });

      gateway.handleUserDisconnecting({ clientId: "user1", nickname: "닉네임_user1" });

      expect(mockServer.to).toHaveBeenCalledWith("user2");
      expect(mockServer.to).toHaveBeenCalledWith("user3");
      expect(mockServer.emit).toHaveBeenCalledWith(KnockEventType.KNOCK_CANCELLED, {
        fromUserId: "user1",
      });
    });

    it("연결 해제 시 받은 노크를 취소해야 함", () => {
      knockService.removeAllKnocksForUser.mockReturnValue({
        sentTo: [],
        receivedFrom: ["user2"],
      });

      gateway.handleUserDisconnecting({ clientId: "user1", nickname: "닉네임_user1" });

      expect(mockServer.to).toHaveBeenCalledWith("user2");
      expect(mockServer.emit).toHaveBeenCalledWith(KnockEventType.KNOCK_CANCELLED, {
        targetUserId: "user1",
      });
    });
  });
});
