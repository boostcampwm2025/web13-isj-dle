import { type EventEmitter2 } from "@nestjs/event-emitter";

import { RoomEventType } from "@shared/types";
import { type Server, type Socket } from "socket.io";

import { RoomGateway } from "../../src/game/room.gateway";
import { type KnockService } from "../../src/knock/knock.service";
import { type StopwatchGateway } from "../../src/stopwatch/stopwatch.gateway";
import { type TimerService } from "../../src/timer/timer.service";
import { type UserService } from "../../src/user/user.service";

describe("RoomGateway", () => {
  let gateway: RoomGateway;
  let userService: jest.Mocked<UserService>;
  let knockService: jest.Mocked<KnockService>;
  let timerService: jest.Mocked<TimerService>;
  let stopwatchGateway: jest.Mocked<StopwatchGateway>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let mockServer: jest.Mocked<Server>;

  const createMockSocket = (id: string): jest.Mocked<Socket> =>
    ({
      id,
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      broadcast: { emit: jest.fn() },
    }) as unknown as jest.Mocked<Socket>;

  beforeEach(() => {
    userService = {
      getSession: jest.fn(),
      getAllSessions: jest.fn().mockReturnValue([]),
      getRoomSessions: jest.fn().mockReturnValue([]),
      updateSessionRoom: jest.fn().mockReturnValue(true),
      updateSessionContactId: jest.fn(),
      updateSessionDeskStatus: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    knockService = {
      removeAllKnocksForUser: jest.fn().mockReturnValue({ sentTo: [], receivedFrom: [] }),
      removeTalkingPair: jest.fn(),
    } as unknown as jest.Mocked<KnockService>;

    timerService = {
      deleteTimer: jest.fn(),
    } as unknown as jest.Mocked<TimerService>;

    stopwatchGateway = {
      handleUserLeft: jest.fn(),
    } as unknown as jest.Mocked<StopwatchGateway>;

    eventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    gateway = new RoomGateway(userService, knockService, timerService, stopwatchGateway, eventEmitter);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleRoomJoin", () => {
    it("roomId가 없으면 실패를 반환해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const ack = jest.fn();

      await gateway.handleRoomJoin(mockSocket, { roomId: "" } as any, ack);

      expect(ack).toHaveBeenCalledWith({ success: false });
    });

    it("payload가 없으면 실패를 반환해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const ack = jest.fn();

      await gateway.handleRoomJoin(mockSocket, null as any, ack);

      expect(ack).toHaveBeenCalledWith({ success: false });
    });

    it("세션이 없으면 실패를 반환해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const ack = jest.fn();
      userService.getSession.mockReturnValue(undefined as any);

      await gateway.handleRoomJoin(mockSocket, { roomId: "lobby" }, ack);

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "User session not found" });
      expect(ack).toHaveBeenCalledWith({ success: false });
    });

    it("lobby에서 meeting1으로 방 이동 시 성공해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "client-1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "lobby" },
      };
      const updatedUser = {
        ...mockUser,
        avatar: { currentRoomId: "meeting (web 1)" },
      };
      const ack = jest.fn();

      userService.getSession.mockReturnValueOnce(mockUser as any).mockReturnValueOnce(updatedUser as any);
      userService.updateSessionRoom.mockReturnValue(true);

      await gateway.handleRoomJoin(mockSocket, { roomId: "meeting (web 1)" }, ack);

      expect(mockSocket.leave).toHaveBeenCalledWith("lobby");
      expect(mockSocket.join).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(RoomEventType.ROOM_JOINED, {
        userId: "client-1",
        avatar: updatedUser.avatar,
      });
      expect(ack).toHaveBeenCalledWith({ success: true });
    });

    it("desk zone에서 다른 방으로 이동 시 대화를 종료해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "client-1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "desk zone" },
      };
      const updatedUser = {
        ...mockUser,
        avatar: { currentRoomId: "lobby" },
      };
      const ack = jest.fn();

      userService.getSession.mockReturnValueOnce(mockUser as any).mockReturnValueOnce(updatedUser as any);
      knockService.removeAllKnocksForUser.mockReturnValue({
        sentTo: ["user2"],
        receivedFrom: ["user3"],
      });

      await gateway.handleRoomJoin(mockSocket, { roomId: "lobby" }, ack);

      expect(knockService.removeAllKnocksForUser).toHaveBeenCalledWith("client-1");
      expect(mockServer.to).toHaveBeenCalledWith("user2");
      expect(mockServer.to).toHaveBeenCalledWith("user3");
      expect(userService.updateSessionDeskStatus).toHaveBeenCalledWith("client-1", null);
    });

    it("desk zone 입장 시 available 상태로 설정해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "client-1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "lobby" },
      };
      const updatedUser = {
        ...mockUser,
        avatar: { currentRoomId: "desk zone" },
      };
      const ack = jest.fn();

      userService.getSession.mockReturnValueOnce(mockUser as any).mockReturnValueOnce(updatedUser as any);
      userService.getRoomSessions.mockReturnValue([]);

      await gateway.handleRoomJoin(mockSocket, { roomId: "desk zone" }, ack);

      expect(userService.updateSessionDeskStatus).toHaveBeenCalledWith("client-1", "available");
      expect(mockServer.to).toHaveBeenCalledWith("desk zone");
    });

    it("lobby에서 이동 시 boundary-clear 이벤트를 전송해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "client-1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "lobby" },
      };
      const updatedUser = {
        ...mockUser,
        avatar: { currentRoomId: "meeting1" },
      };
      const ack = jest.fn();

      userService.getSession.mockReturnValueOnce(mockUser as any).mockReturnValueOnce(updatedUser as any);

      await gateway.handleRoomJoin(mockSocket, { roomId: "meeting (web 1)" }, ack);

      expect(mockServer.emit).toHaveBeenCalledWith("internal:boundary-clear", { userId: "client-1" });
      expect(userService.updateSessionContactId).toHaveBeenCalledWith("client-1", null);
    });
  });

  describe("handleUserLeavingRoom", () => {
    it("meeting 방을 떠날 때 방에 아무도 없으면 타이머를 삭제해야 함", () => {
      userService.getRoomSessions.mockReturnValue([]);

      gateway.handleUserLeavingRoom({ roomId: "meeting (web 1)" });

      expect(timerService.deleteTimer).toHaveBeenCalledWith("meeting (web 1)");
    });

    it("meeting 방을 떠날 때 사용자가 남아있으면 타이머를 유지해야 함", () => {
      userService.getRoomSessions.mockReturnValue([{ id: "user1" }] as any);

      gateway.handleUserLeavingRoom({ roomId: "meeting (web 1)" });

      expect(timerService.deleteTimer).not.toHaveBeenCalled();
    });

    it("meeting 방이 아닌 경우 타이머 삭제를 하지 않아야 함", () => {
      gateway.handleUserLeavingRoom({ roomId: "lobby" });

      expect(timerService.deleteTimer).not.toHaveBeenCalled();
    });
  });

  describe("isTimerRoomId (private)", () => {
    it("meeting으로 시작하는 roomId는 타이머 방이어야 함", () => {
      // private 함수를 테스트하기 위해 간접적으로 테스트
      userService.getRoomSessions.mockReturnValue([]);

      gateway.handleUserLeavingRoom({ roomId: "meeting (web 1)" });
      expect(timerService.deleteTimer).toHaveBeenCalledWith("meeting (web 1)");

      jest.clearAllMocks();

      gateway.handleUserLeavingRoom({ roomId: "meeting (web 2)" });
      expect(timerService.deleteTimer).toHaveBeenCalledWith("meeting (web 2)");

      jest.clearAllMocks();

      gateway.handleUserLeavingRoom({ roomId: "lobby" });
      expect(timerService.deleteTimer).not.toHaveBeenCalled();
    });
  });

  describe("cleanupStopwatchAfterLeave (private)", () => {
    it("mogakco 방을 떠날 때 stopwatch cleanup을 호출해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      const mockUser = {
        id: "client-1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "mogakco" },
      };
      const updatedUser = {
        ...mockUser,
        avatar: { currentRoomId: "lobby" },
      };

      userService.getSession.mockReturnValueOnce(mockUser as any).mockReturnValueOnce(updatedUser as any);

      await gateway.handleRoomJoin(mockSocket, { roomId: "lobby" }, jest.fn());

      expect(stopwatchGateway.handleUserLeft).toHaveBeenCalledWith("mogakco", "client-1");
    });
  });
});
