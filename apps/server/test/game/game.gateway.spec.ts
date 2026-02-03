import { type EventEmitter2 } from "@nestjs/event-emitter";

import { UserEventType } from "@shared/types";
import { type Server, type Socket } from "socket.io";

import { type BoundaryService } from "../../src/boundary/boundary.service";
import { type BoundaryTracker } from "../../src/boundary/boundaryTracker.service";
import { GameGateway } from "../../src/game/game.gateway";
import { type MetricsService } from "../../src/metrics";
import { type UserService } from "../../src/user/user.service";

describe("GameGateway", () => {
  let gateway: GameGateway;
  let userService: jest.Mocked<UserService>;
  let boundaryService: jest.Mocked<BoundaryService>;
  let boundaryTracker: jest.Mocked<BoundaryTracker>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let metricsService: jest.Mocked<MetricsService>;
  let mockServer: jest.Mocked<Server>;

  const createMockSocket = (id: string): jest.Mocked<Socket> =>
    ({
      id,
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      broadcast: { emit: jest.fn() },
      disconnect: jest.fn(),
      setMaxListeners: jest.fn(),
    }) as unknown as jest.Mocked<Socket>;

  beforeEach(() => {
    userService = {
      createSession: jest.fn(),
      getSession: jest.fn(),
      deleteSession: jest.fn(),
      getAllSessions: jest.fn().mockReturnValue([]),
      getRoomSessions: jest.fn().mockReturnValue([]),
      updateSessionContactId: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    boundaryService = {
      findConnectedGroups: jest.fn().mockReturnValue(new Map()),
    } as unknown as jest.Mocked<BoundaryService>;

    boundaryTracker = {
      clear: jest.fn(),
      pruneInactiveGroups: jest.fn(),
      joinGroup: jest.fn(),
      leaveGroup: jest.fn(),
    } as unknown as jest.Mocked<BoundaryTracker>;

    eventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    metricsService = {
      incrementWsConnections: jest.fn(),
      decrementWsConnections: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    mockServer = {
      setMaxListeners: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    gateway = new GameGateway(userService, boundaryService, boundaryTracker, eventEmitter, metricsService);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("handleConnection", () => {
    it("새 클라이언트 연결 시 세션을 생성하고 USER_SYNC를 전송해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "client-1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "lobby", assetKey: "ADAM" },
      };

      userService.createSession.mockReturnValue(mockUser as any);
      userService.getAllSessions.mockReturnValue([mockUser as any]);

      await gateway.handleConnection(mockSocket);

      expect(userService.createSession).toHaveBeenCalledWith({ id: "client-1" });
      expect(mockSocket.join).toHaveBeenCalledWith("lobby");
      expect(mockSocket.emit).toHaveBeenCalledWith(UserEventType.USER_SYNC, {
        user: mockUser,
        users: [mockUser],
      });
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(UserEventType.USER_JOIN, { user: mockUser });
      expect(metricsService.incrementWsConnections).toHaveBeenCalled();
    });

    it("세션 생성 실패 시 연결을 끊어야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      userService.createSession.mockReturnValue(null as any);

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(metricsService.incrementWsConnections).not.toHaveBeenCalled();
    });
  });

  describe("handleDisconnect", () => {
    it("클라이언트 연결 해제 시 세션을 삭제하고 USER_LEFT를 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "client-1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "lobby" },
      };

      userService.getSession.mockReturnValue(mockUser as any);
      userService.deleteSession.mockReturnValue(true);

      gateway.handleDisconnect(mockSocket);

      expect(boundaryTracker.clear).toHaveBeenCalledWith("client-1");
      expect(userService.deleteSession).toHaveBeenCalledWith("client-1");
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(UserEventType.USER_LEFT, { userId: "client-1" });
      expect(metricsService.decrementWsConnections).toHaveBeenCalled();
    });

    it("세션이 없는 클라이언트 연결 해제도 처리해야 함", () => {
      const mockSocket = createMockSocket("unknown-client");
      userService.getSession.mockReturnValue(undefined as any);
      userService.deleteSession.mockReturnValue(false);

      gateway.handleDisconnect(mockSocket);

      expect(boundaryTracker.clear).toHaveBeenCalledWith("unknown-client");
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(UserEventType.USER_LEFT, { userId: "unknown-client" });
    });
  });

  describe("handleBoundaryClear", () => {
    it("지정된 사용자의 boundary를 clear해야 함", () => {
      const mockSocket = createMockSocket("client-1");

      gateway.handleBoundaryClear(mockSocket, { userId: "target-user" });

      expect(boundaryTracker.clear).toHaveBeenCalledWith("target-user");
    });
  });

  describe("runBoundaryTick (private)", () => {
    it("로비에 사용자가 없으면 아무 작업도 하지 않아야 함", () => {
      userService.getRoomSessions.mockReturnValue([]);

      // private 메서드 호출을 위해 any로 캐스팅
      (gateway as any).runBoundaryTick();

      expect(boundaryService.findConnectedGroups).not.toHaveBeenCalled();
    });

    it("연결된 그룹의 사용자에게 contactId를 할당해야 함", () => {
      const lobbyUsers = [
        { id: "user1", avatar: { state: "idle" } },
        { id: "user2", avatar: { state: "idle" } },
      ];

      userService.getRoomSessions.mockReturnValue(lobbyUsers as any);
      boundaryService.findConnectedGroups.mockReturnValue(new Map([["group-1", ["user1", "user2"]]]));
      boundaryTracker.joinGroup.mockReturnValue("contact-123");

      (gateway as any).runBoundaryTick();

      expect(boundaryTracker.joinGroup).toHaveBeenCalledWith("user1", "group-1");
      expect(boundaryTracker.joinGroup).toHaveBeenCalledWith("user2", "group-1");
      expect(userService.updateSessionContactId).toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith("lobby");
    });

    it("그룹에 속하지 않은 사용자는 leaveGroup을 호출해야 함", () => {
      const lobbyUsers = [
        { id: "user1", avatar: { state: "idle" } },
        { id: "user2", avatar: { state: "idle" } },
      ];

      userService.getRoomSessions.mockReturnValue(lobbyUsers as any);
      boundaryService.findConnectedGroups.mockReturnValue(new Map());
      boundaryTracker.leaveGroup.mockReturnValue(null);

      (gateway as any).runBoundaryTick();

      expect(boundaryTracker.leaveGroup).toHaveBeenCalledWith("user1");
      expect(boundaryTracker.leaveGroup).toHaveBeenCalledWith("user2");
    });

    it("업데이트가 없으면 이벤트를 전송하지 않아야 함", () => {
      const lobbyUsers = [{ id: "user1", avatar: { state: "idle" } }];

      userService.getRoomSessions.mockReturnValue(lobbyUsers as any);
      boundaryService.findConnectedGroups.mockReturnValue(new Map());
      boundaryTracker.leaveGroup.mockReturnValue(undefined);

      (gateway as any).runBoundaryTick();

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });
});
