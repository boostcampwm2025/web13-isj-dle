import { StopwatchEventType } from "@shared/types";
import { type Server, type Socket } from "socket.io";

import { StopwatchGateway } from "../../src/stopwatch/stopwatch.gateway";
import { StopwatchService } from "../../src/stopwatch/stopwatch.service";
import { type UserService } from "../../src/user/user.service";

describe("StopwatchGateway", () => {
  let gateway: StopwatchGateway;
  let stopwatchService: StopwatchService;
  let userService: jest.Mocked<UserService>;
  let mockServer: jest.Mocked<Server>;

  const createMockSocket = (id: string): jest.Mocked<Socket> =>
    ({
      id,
      emit: jest.fn(),
    }) as unknown as jest.Mocked<Socket>;

  beforeEach(() => {
    stopwatchService = new StopwatchService();

    userService = {
      getSession: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    gateway = new StopwatchGateway(stopwatchService, userService);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleConnection", () => {
    it("mogakco 방에 있는 사용자 연결 시 socketUserMap에 등록해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "user1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "mogakco" },
      };
      userService.getSession.mockReturnValue(mockUser as any);

      gateway.handleConnection(mockSocket);

      expect(userService.getSession).toHaveBeenCalledWith("client-1");
    });

    it("mogakco 방이 아닌 사용자는 socketUserMap에 등록하지 않아야 함 (lobby)", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "user1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "lobby" },
      };
      userService.getSession.mockReturnValue(mockUser as any);

      gateway.handleConnection(mockSocket);

      gateway.handleDisconnect(mockSocket);
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("회의실 사용자는 socketUserMap에 등록하지 않아야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "user1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "meeting (web 1)" },
      };
      userService.getSession.mockReturnValue(mockUser as any);

      gateway.handleConnection(mockSocket);

      gateway.handleDisconnect(mockSocket);
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe("handleStopwatchUpdate", () => {
    it("유효한 요청 시 상태를 업데이트하고 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "user1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "mogakco" },
      };
      userService.getSession.mockReturnValue(mockUser as any);

      const stopwatch = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };

      gateway.handleStopwatchUpdate(mockSocket, {
        roomId: "mogakco",
        stopwatch,
        timer,
      });

      expect(mockServer.to).toHaveBeenCalledWith("mogakco");
      expect(mockServer.emit).toHaveBeenCalledWith(
        StopwatchEventType.STOPWATCH_STATE,
        expect.objectContaining({
          users: expect.arrayContaining([
            expect.objectContaining({
              userId: "user1",
              nickname: "테스트유저",
            }),
          ]),
        }),
      );
    });

    it("mogakco 방이 아니면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "user1", avatar: { currentRoomId: "meeting (web 1)" } };
      userService.getSession.mockReturnValue(mockUser as any);

      gateway.handleStopwatchUpdate(mockSocket, {
        roomId: "meeting (web 1)",
        stopwatch: { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 },
        timer: { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 },
      });

      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("세션이 없으면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      userService.getSession.mockReturnValue(undefined as any);

      gateway.handleStopwatchUpdate(mockSocket, {
        roomId: "mogakco",
        stopwatch: { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 },
        timer: { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 },
      });

      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("사용자가 다른 방에 있으면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "user1", avatar: { currentRoomId: "lobby" } };
      userService.getSession.mockReturnValue(mockUser as any);

      gateway.handleStopwatchUpdate(mockSocket, {
        roomId: "mogakco",
        stopwatch: { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 },
        timer: { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 },
      });

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe("handleStopwatchSync", () => {
    it("유효한 요청 시 현재 상태를 클라이언트에게 전송해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "user1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "mogakco" },
      };
      userService.getSession.mockReturnValue(mockUser as any);

      const stopwatch = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };
      stopwatchService.updateUserState("mogakco", "user2", "유저2", stopwatch, timer);

      gateway.handleStopwatchSync(mockSocket, { roomId: "mogakco" });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        StopwatchEventType.STOPWATCH_STATE,
        expect.objectContaining({
          users: expect.arrayContaining([expect.objectContaining({ userId: "user2" })]),
        }),
      );
    });
  });

  describe("handleDisconnect", () => {
    it("mogakco 방 사용자 연결 해제 시 상태를 제거하고 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "user1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "mogakco" },
      };
      userService.getSession.mockReturnValue(mockUser as any);

      gateway.handleConnection(mockSocket);
      gateway.handleStopwatchUpdate(mockSocket, {
        roomId: "mogakco",
        stopwatch: { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 },
        timer: { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 },
      });

      jest.clearAllMocks();

      gateway.handleDisconnect(mockSocket);

      expect(mockServer.to).toHaveBeenCalledWith("mogakco");
      expect(mockServer.emit).toHaveBeenCalledWith(
        StopwatchEventType.STOPWATCH_STATE,
        expect.objectContaining({ users: [] }),
      );
    });

    it("socketUserMap에 없는 클라이언트 연결 해제는 무시해야 함", () => {
      const mockSocket = createMockSocket("unknown-client");

      gateway.handleDisconnect(mockSocket);

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe("handleUserLeft", () => {
    it("mogakco 방에서 사용자가 떠나면 상태를 제거하고 브로드캐스트해야 함", () => {
      const stopwatch = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };
      stopwatchService.updateUserState("mogakco", "user1", "유저1", stopwatch, timer);

      gateway.handleUserLeft("mogakco", "user1");

      expect(mockServer.to).toHaveBeenCalledWith("mogakco");
      expect(mockServer.emit).toHaveBeenCalledWith(
        StopwatchEventType.STOPWATCH_STATE,
        expect.objectContaining({ users: [] }),
      );
    });

    it("mogakco 방이 아니면 무시해야 함", () => {
      gateway.handleUserLeft("meeting (web 1)", "user1");

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });
});
