import { LecternEventType, UserEventType } from "@shared/types";
import { type Server, type Socket } from "socket.io";

import { LecternGateway } from "../../src/lectern/lectern.gateway";
import { type LecternService } from "../../src/lectern/lectern.service";
import { type UserService } from "../../src/user/user.service";

describe("LecternGateway", () => {
  let gateway: LecternGateway;
  let lecternService: jest.Mocked<LecternService>;
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
    micOn: true,
    avatar: { currentRoomId: "meeting" },
    ...overrides,
  });

  beforeEach(() => {
    lecternService = {
      enterLectern: jest.fn().mockReturnValue({
        hostId: "user1",
        usersOnLectern: ["user1"],
        roomId: null,
      }),
      leaveLectern: jest.fn().mockReturnValue({
        hostId: null,
        usersOnLectern: [],
        roomId: null,
      }),
      isHost: jest.fn().mockReturnValue(true),
      removeUserFromAllLecterns: jest.fn().mockReturnValue(new Map()),
      createBreakout: jest.fn().mockReturnValue({
        isActive: true,
        hostRoomId: "meeting",
        rooms: [{ roomId: "breakout-meeting-1", userIds: [] }],
        hostId: "user1",
        config: { roomCount: 2, isRandom: false },
      }),
      getBreakoutState: jest.fn(),
      endBreakout: jest.fn(),
      joinBreakoutRoom: jest.fn(),
      leaveBreakoutRoom: jest.fn(),
    } as unknown as jest.Mocked<LecternService>;

    userService = {
      getSession: jest.fn(),
      getRoomSessions: jest.fn().mockReturnValue([]),
      updateSessionMedia: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Server>;

    gateway = new LecternGateway(lecternService, userService);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleLecternEnter", () => {
    it("강연대 입장 시 상태를 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("user1");

      gateway.handleLecternEnter(mockSocket, { roomId: "seminar (ios)" });

      expect(lecternService.enterLectern).toHaveBeenCalledWith("seminar (ios)", "user1");
      expect(mockServer.to).toHaveBeenCalledWith("seminar (ios)");
      expect(mockServer.emit).toHaveBeenCalledWith(LecternEventType.LECTERN_UPDATE, {
        roomId: "seminar (ios)",
        hostId: "user1",
        usersOnLectern: ["user1"],
      });
    });
  });

  describe("handleLecternLeave", () => {
    it("강연대 퇴장 시 상태를 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("user1");

      gateway.handleLecternLeave(mockSocket, { roomId: "seminar (ios)" });

      expect(lecternService.leaveLectern).toHaveBeenCalledWith("seminar (ios)", "user1");
      expect(mockServer.to).toHaveBeenCalledWith("seminar (ios)");
      expect(mockServer.emit).toHaveBeenCalledWith(LecternEventType.LECTERN_UPDATE, {
        roomId: "seminar (ios)",
        hostId: null,
        usersOnLectern: [],
      });
    });
  });

  describe("handleMuteAll", () => {
    it("호스트가 전체 음소거를 실행해야 함", () => {
      const mockSocket = createMockSocket("host1");
      const callback = jest.fn();
      const users = [createMockUser("user1"), createMockUser("user2"), createMockUser("host1")];

      userService.getRoomSessions.mockReturnValue(users as never);

      gateway.handleMuteAll(mockSocket, { roomId: "seminar (ios)" }, callback);

      expect(userService.updateSessionMedia).toHaveBeenCalledWith("user1", { micOn: false });
      expect(userService.updateSessionMedia).toHaveBeenCalledWith("user2", { micOn: false });
      expect(mockServer.to).toHaveBeenCalledWith("seminar (ios)");
      expect(mockServer.emit).toHaveBeenCalledWith(LecternEventType.MUTE_ALL_EXECUTED, {
        hostId: "host1",
      });
      expect(callback).toHaveBeenCalledWith({ success: true });
    });

    it("호스트가 아니면 전체 음소거가 실패해야 함", () => {
      const mockSocket = createMockSocket("user1");
      const callback = jest.fn();

      lecternService.isHost.mockReturnValue(false);

      gateway.handleMuteAll(mockSocket, { roomId: "seminar (ios)" }, callback);

      expect(callback).toHaveBeenCalledWith({ success: false });
      expect(userService.updateSessionMedia).not.toHaveBeenCalled();
    });

    it("콜백 없이도 동작해야 함", () => {
      const mockSocket = createMockSocket("host1");
      const users = [createMockUser("user1")];

      userService.getRoomSessions.mockReturnValue(users as never);

      expect(() => gateway.handleMuteAll(mockSocket, { roomId: "seminar (ios)" })).not.toThrow();
    });
  });

  describe("handleBreakoutCreate", () => {
    it("소회의실을 생성해야 함", () => {
      const mockSocket = createMockSocket("host1");
      const payload = {
        hostRoomId: "seminar (ios)" as const,
        config: { roomCount: 2, isRandom: false },
        userIds: ["user1", "user2"],
      };

      gateway.handleBreakoutCreate(mockSocket, payload);

      expect(lecternService.createBreakout).toHaveBeenCalledWith(
        "seminar (ios)",
        "host1",
        payload.config,
        payload.userIds,
      );
      expect(mockServer.to).toHaveBeenCalledWith("seminar (ios)");
      expect(mockServer.emit).toHaveBeenCalledWith(LecternEventType.BREAKOUT_UPDATE, expect.any(Object));
    });

    it("호스트가 아니면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");

      lecternService.isHost.mockReturnValue(false);

      gateway.handleBreakoutCreate(mockSocket, {
        hostRoomId: "seminar (ios)",
        config: { roomCount: 2, isRandom: false },
        userIds: [],
      });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "You're not a host" });
      expect(lecternService.createBreakout).not.toHaveBeenCalled();
    });

    it("소회의실 생성 실패 시 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("host1");

      lecternService.createBreakout.mockReturnValue(null);

      gateway.handleBreakoutCreate(mockSocket, {
        hostRoomId: "seminar (ios)",
        config: { roomCount: 2, isRandom: false },
        userIds: [],
      });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "Breakout cannot be executed" });
    });
  });

  describe("handleBreakoutEnd", () => {
    it("소회의실을 종료해야 함", () => {
      const mockSocket = createMockSocket("host1");

      gateway.handleBreakoutEnd(mockSocket, { hostRoomId: "seminar (ios)" });

      expect(lecternService.endBreakout).toHaveBeenCalledWith("seminar (ios)");
      expect(mockServer.to).toHaveBeenCalledWith("seminar (ios)");
      expect(mockServer.emit).toHaveBeenCalledWith(LecternEventType.BREAKOUT_UPDATE, {
        hostRoomId: "seminar (ios)",
        state: null,
      });
    });

    it("호스트가 아니면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");

      lecternService.isHost.mockReturnValue(false);

      gateway.handleBreakoutEnd(mockSocket, { hostRoomId: "seminar (ios)" });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "You're not a host" });
      expect(lecternService.endBreakout).not.toHaveBeenCalled();
    });
  });

  describe("handleBreakoutJoin", () => {
    it("소회의실에 참여해야 함", () => {
      const mockSocket = createMockSocket("user1");
      const breakoutState = {
        isActive: true,
        hostRoomId: "meeting",
        rooms: [{ roomId: "breakout-meeting-1", userIds: ["user1"] }],
        hostId: "host1",
        config: { roomCount: 2, isRandom: false },
      };

      lecternService.getBreakoutState.mockReturnValue(breakoutState);
      lecternService.joinBreakoutRoom.mockReturnValue(breakoutState);

      gateway.handleBreakoutJoin(mockSocket, {
        hostRoomId: "seminar (ios)",
        userId: "user1",
        targetRoomId: "breakout-seminar-1",
      });

      expect(lecternService.joinBreakoutRoom).toHaveBeenCalledWith("seminar (ios)", "user1", "breakout-seminar-1");
      expect(mockServer.emit).toHaveBeenCalledWith(LecternEventType.BREAKOUT_UPDATE, expect.any(Object));
    });

    it("진행 중인 소회의실이 없으면 에러를 발생시켜야 함", () => {
      const mockSocket = createMockSocket("user1");

      lecternService.getBreakoutState.mockReturnValue(null);

      gateway.handleBreakoutJoin(mockSocket, {
        hostRoomId: "seminar (ios)",
        userId: "user1",
        targetRoomId: "breakout-seminar-1",
      });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", { message: "진행 중인 소회의실이 없습니다." });
    });

    it("랜덤 배정 모드에서 비호스트는 이동 불가해야 함", () => {
      const mockSocket = createMockSocket("user1");
      const breakoutState = {
        isActive: true,
        hostRoomId: "meeting",
        rooms: [],
        hostId: "host1",
        config: { roomCount: 2, isRandom: true },
      };

      lecternService.getBreakoutState.mockReturnValue(breakoutState);
      lecternService.isHost.mockReturnValue(false);

      gateway.handleBreakoutJoin(mockSocket, {
        hostRoomId: "seminar (ios)",
        userId: "user1",
        targetRoomId: "breakout-seminar-1",
      });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", {
        message: "랜덤 배정 모드에서는 방 이동이 불가능합니다.",
      });
    });

    it("호스트는 랜덤 배정 모드에서도 사용자를 이동시킬 수 있어야 함", () => {
      const mockSocket = createMockSocket("host1");
      const breakoutState = {
        isActive: true,
        hostRoomId: "meeting",
        rooms: [{ roomId: "breakout-meeting-1", userIds: [] }],
        hostId: "host1",
        config: { roomCount: 2, isRandom: true },
      };

      lecternService.getBreakoutState.mockReturnValue(breakoutState);
      lecternService.isHost.mockReturnValue(true);
      lecternService.joinBreakoutRoom.mockReturnValue(breakoutState);

      gateway.handleBreakoutJoin(mockSocket, {
        hostRoomId: "seminar (ios)",
        userId: "user1",
        targetRoomId: "breakout-seminar-1",
      });

      expect(lecternService.joinBreakoutRoom).toHaveBeenCalled();
    });
  });

  describe("handleBreakoutLeave", () => {
    it("소회의실에서 나가야 함", () => {
      const mockSocket = createMockSocket("user1");
      const breakoutState = {
        isActive: true,
        hostRoomId: "seminar (ios)",
        rooms: [{ roomId: "breakout-seminar-1", userIds: [] }],
        hostId: "host1",
        config: { roomCount: 2, isRandom: false },
      };

      lecternService.leaveBreakoutRoom.mockReturnValue(breakoutState);

      gateway.handleBreakoutLeave(mockSocket, {
        hostRoomId: "seminar (ios)",
        userId: "user1",
        targetRoomId: "breakout-seminar-1",
      });

      expect(lecternService.leaveBreakoutRoom).toHaveBeenCalledWith("seminar (ios)", "user1");
      expect(mockServer.emit).toHaveBeenCalledWith(LecternEventType.BREAKOUT_UPDATE, expect.any(Object));
    });

    it("leaveBreakoutRoom이 null을 반환하면 브로드캐스트하지 않아야 함", () => {
      const mockSocket = createMockSocket("user1");

      lecternService.leaveBreakoutRoom.mockReturnValue(null);

      gateway.handleBreakoutLeave(mockSocket, {
        hostRoomId: "seminar (ios)",
        userId: "user1",
        targetRoomId: "breakout-seminar-1",
      });

      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe("handleUserDisconnect", () => {
    it("연결 해제 시 모든 강연대에서 사용자를 제거해야 함", () => {
      const affectedRooms = new Map([
        [
          "seminar (ios)",
          {
            hostId: null,
            usersOnLectern: [],
            roomId: null,
          },
        ],
      ]);

      lecternService.removeUserFromAllLecterns.mockReturnValue(affectedRooms as never);

      gateway.handleUserDisconnect({ clientId: "user1", nickname: "닉네임_user1" });

      expect(lecternService.removeUserFromAllLecterns).toHaveBeenCalledWith("user1");
      expect(mockServer.to).toHaveBeenCalledWith("seminar (ios)");
      expect(mockServer.emit).toHaveBeenCalledWith(LecternEventType.LECTERN_UPDATE, {
        roomId: "seminar (ios)",
        hostId: null,
        usersOnLectern: [],
      });
    });

    it("영향받는 방이 없으면 브로드캐스트하지 않아야 함", () => {
      lecternService.removeUserFromAllLecterns.mockReturnValue(new Map());

      gateway.handleUserDisconnect({ clientId: "user1", nickname: "닉네임_user1" });

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });
});
