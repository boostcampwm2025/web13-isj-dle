import { TimerEventType } from "@shared/types";
import { type Server, type Socket } from "socket.io";

import { TimerGateway } from "../../src/timer/timer.gateway";
import { TimerService } from "../../src/timer/timer.service";
import { type UserService } from "../../src/user/user.service";

describe("TimerGateway", () => {
  let gateway: TimerGateway;
  let timerService: TimerService;
  let userService: jest.Mocked<UserService>;
  let mockServer: jest.Mocked<Server>;

  const createMockSocket = (id: string): jest.Mocked<Socket> =>
    ({
      id,
      emit: jest.fn(),
    }) as unknown as jest.Mocked<Socket>;

  beforeEach(() => {
    timerService = new TimerService();

    userService = {
      getSession: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    gateway = new TimerGateway(timerService, userService);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleTimerStart", () => {
    it("유효한 요청 시 타이머를 시작하고 상태를 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "client-1", avatar: { currentRoomId: "meeting (web 1)" } };
      userService.getSession.mockReturnValue(mockUser as any);

      const startedAt = Date.now();
      gateway.handleTimerStart(mockSocket, {
        roomId: "meeting (web 1)",
        initialTimeSec: 300,
        startedAt,
      });

      expect(mockServer.to).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(TimerEventType.TIMER_STATE, {
        isRunning: true,
        initialTimeSec: 300,
        startedAt,
        pausedTimeSec: 0,
      });
    });

    it("meeting 방이 아니면 무시해야 함 (lobby)", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "client-1", avatar: { currentRoomId: "lobby" } };
      userService.getSession.mockReturnValue(mockUser as any);

      gateway.handleTimerStart(mockSocket, {
        roomId: "lobby",
        initialTimeSec: 300,
        startedAt: Date.now(),
      });

      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("사용자가 다른 방에 있으면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "client-1", avatar: { currentRoomId: "meeting (web 2)" } };
      userService.getSession.mockReturnValue(mockUser as any);

      gateway.handleTimerStart(mockSocket, {
        roomId: "meeting (web 1)",
        initialTimeSec: 300,
        startedAt: Date.now(),
      });

      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("세션이 없으면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      userService.getSession.mockReturnValue(undefined as any);

      gateway.handleTimerStart(mockSocket, {
        roomId: "meeting (web 1)",
        initialTimeSec: 300,
        startedAt: Date.now(),
      });

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe("handleTimerPause", () => {
    it("유효한 요청 시 타이머를 일시정지하고 상태를 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "client-1", avatar: { currentRoomId: "meeting (web 1)" } };
      userService.getSession.mockReturnValue(mockUser as any);

      timerService.startTimer("meeting (web 1)", 300, Date.now());

      gateway.handleTimerPause(mockSocket, {
        roomId: "meeting (web 1)",
        pausedTimeSec: 250,
      });

      expect(mockServer.to).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(
        TimerEventType.TIMER_STATE,
        expect.objectContaining({
          isRunning: false,
          pausedTimeSec: 250,
          startedAt: null,
        }),
      );
    });
  });

  describe("handleTimerReset", () => {
    it("유효한 요청 시 타이머를 리셋하고 상태를 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "client-1", avatar: { currentRoomId: "meeting (web 1)" } };
      userService.getSession.mockReturnValue(mockUser as any);

      timerService.startTimer("meeting (web 1)", 300, Date.now());

      gateway.handleTimerReset(mockSocket, { roomId: "meeting (web 1)" });

      expect(mockServer.to).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(TimerEventType.TIMER_STATE, {
        isRunning: false,
        initialTimeSec: 0,
        startedAt: null,
        pausedTimeSec: 0,
      });
    });
  });

  describe("handleTimerAddTime", () => {
    it("유효한 요청 시 시간을 추가하고 상태를 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "client-1", avatar: { currentRoomId: "meeting (web 1)" } };
      userService.getSession.mockReturnValue(mockUser as any);

      const startedAt = Date.now();
      timerService.startTimer("meeting (web 1)", 300, startedAt);

      gateway.handleTimerAddTime(mockSocket, {
        roomId: "meeting (web 1)",
        additionalSec: 60,
      });

      expect(mockServer.to).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(
        TimerEventType.TIMER_STATE,
        expect.objectContaining({
          isRunning: true,
          initialTimeSec: 360,
        }),
      );
    });
  });

  describe("handleTimerSync", () => {
    it("유효한 요청 시 현재 상태를 클라이언트에게 전송해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "client-1", avatar: { currentRoomId: "meeting (web 1)" } };
      userService.getSession.mockReturnValue(mockUser as any);

      const startedAt = Date.now();
      timerService.startTimer("meeting (web 1)", 300, startedAt);

      gateway.handleTimerSync(mockSocket, { roomId: "meeting (web 1)" });

      expect(mockSocket.emit).toHaveBeenCalledWith(TimerEventType.TIMER_STATE, {
        isRunning: true,
        initialTimeSec: 300,
        startedAt,
        pausedTimeSec: 0,
      });
    });

    it("타이머가 이미 끝났으면 상태를 전송하지 않아야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = { id: "client-1", avatar: { currentRoomId: "meeting (web 1)" } };
      userService.getSession.mockReturnValue(mockUser as any);

      const startedAt = Date.now() - 2000;
      timerService.startTimer("meeting (web 1)", 1, startedAt);

      gateway.handleTimerSync(mockSocket, { roomId: "meeting (web 1)" });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});
