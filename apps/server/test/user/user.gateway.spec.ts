import { UserEventType } from "@shared/types";
import { type Server, type Socket } from "socket.io";

import { UserGateway } from "../../src/user/user.gateway";
import { type UserService } from "../../src/user/user.service";

describe("UserGateway", () => {
  let gateway: UserGateway;
  let userService: jest.Mocked<UserService>;
  let mockServer: jest.Mocked<Server>;

  const createMockSocket = (id: string): jest.Mocked<Socket> =>
    ({
      id,
      emit: jest.fn(),
    }) as unknown as jest.Mocked<Socket>;

  beforeEach(() => {
    userService = {
      updateSessionMedia: jest.fn().mockReturnValue(true),
      updateSessionPosition: jest.fn().mockReturnValue(true),
      getSession: jest.fn().mockReturnValue({
        id: "client-1",
        nickname: "테스트유저",
        avatar: { currentRoomId: "lobby" },
      }),
    } as unknown as jest.Mocked<UserService>;

    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Server>;

    gateway = new UserGateway(userService);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleUserUpdate", () => {
    it("미디어 상태 업데이트 시 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");

      gateway.handleUserUpdate(mockSocket, { cameraOn: true, micOn: false });

      expect(userService.updateSessionMedia).toHaveBeenCalledWith("client-1", {
        cameraOn: true,
        micOn: false,
      });
      expect(mockServer.emit).toHaveBeenCalledWith(UserEventType.USER_UPDATE, {
        userId: "client-1",
        cameraOn: true,
        micOn: false,
      });
    });

    it("세션이 없으면 브로드캐스트하지 않아야 함", () => {
      const mockSocket = createMockSocket("client-1");
      userService.updateSessionMedia.mockReturnValue(false);

      gateway.handleUserUpdate(mockSocket, { cameraOn: true });

      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it("업데이트 실패 시 브로드캐스트하지 않아야 함", () => {
      const mockSocket = createMockSocket("client-1");
      userService.getSession.mockReturnValue(undefined);

      gateway.handleUserUpdate(mockSocket, { cameraOn: true });

      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  describe("handlePlayerMove", () => {
    it("위치 업데이트 시 방에 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const payload = { x: 100, y: 200, direction: "left" as const, state: "walk" as const };

      gateway.handlePlayerMove(mockSocket, payload);

      expect(userService.updateSessionPosition).toHaveBeenCalledWith("client-1", payload);
      expect(mockServer.to).toHaveBeenCalledWith("lobby");
      expect(mockServer.emit).toHaveBeenCalledWith(UserEventType.PLAYER_MOVED, {
        userId: "client-1",
        ...payload,
      });
    });

    it("세션이 없으면 ack에 실패를 전달해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const ack = jest.fn();
      userService.updateSessionPosition.mockReturnValue(false);

      gateway.handlePlayerMove(mockSocket, { x: 100, y: 200, direction: "left", state: "walk" }, ack);

      expect(ack).toHaveBeenCalledWith({ success: false });
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("getSession이 undefined 반환 시 브로드캐스트하지 않아야 함", () => {
      const mockSocket = createMockSocket("client-1");
      userService.getSession.mockReturnValue(undefined);

      gateway.handlePlayerMove(mockSocket, { x: 100, y: 200, direction: "left", state: "walk" });

      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("force 옵션이 포함된 페이로드도 처리해야 함", () => {
      const mockSocket = createMockSocket("client-1");
      const payload = { x: 100, y: 200, direction: "down" as const, state: "idle" as const, force: true };

      gateway.handlePlayerMove(mockSocket, payload);

      expect(userService.updateSessionPosition).toHaveBeenCalledWith("client-1", payload);
      expect(mockServer.emit).toHaveBeenCalledWith(
        UserEventType.PLAYER_MOVED,
        expect.objectContaining({ force: true }),
      );
    });
  });
});
