import { type MetricsService } from "../../src/metrics/metrics.service";
import { UserService } from "../../src/user/user.service";

describe("UserService", () => {
  let service: UserService;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(() => {
    metricsService = {
      userJoined: jest.fn(),
      userLeft: jest.fn(),
      userMoved: jest.fn(),
      incrementActiveRooms: jest.fn(),
      decrementActiveRooms: jest.fn(),
      recordSessionDuration: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    service = new UserService(metricsService);
  });

  describe("createSession", () => {
    it("새 세션을 생성하고 반환해야 함", () => {
      const user = service.createSession({ id: "user1" });

      expect(user.id).toBe("user1");
      expect(user.nickname).toBeDefined();
      expect(user.avatar.currentRoomId).toBe("lobby");
      expect(user.cameraOn).toBe(false);
      expect(user.micOn).toBe(false);
    });

    it("세션 생성 시 메트릭을 기록해야 함", () => {
      service.createSession({ id: "user1" });

      expect(metricsService.userJoined).toHaveBeenCalledWith("lobby");
    });

    it("각 세션은 고유한 닉네임을 가져야 함", () => {
      const user1 = service.createSession({ id: "user1" });
      const user2 = service.createSession({ id: "user2" });

      expect(user1.nickname).not.toBe(user2.nickname);
    });
  });

  describe("getSession", () => {
    it("존재하는 세션을 반환해야 함", () => {
      service.createSession({ id: "user1" });

      const user = service.getSession("user1");

      expect(user).toBeDefined();
      expect(user?.id).toBe("user1");
    });

    it("존재하지 않는 세션은 undefined를 반환해야 함", () => {
      const user = service.getSession("nonexistent");

      expect(user).toBeUndefined();
    });
  });

  describe("getRoomSessions", () => {
    it("특정 방에 있는 세션들을 반환해야 함", () => {
      service.createSession({ id: "user1" });
      service.createSession({ id: "user2" });

      const sessions = service.getRoomSessions("lobby");

      expect(sessions).toHaveLength(2);
    });

    it("빈 방은 빈 배열을 반환해야 함", () => {
      const sessions = service.getRoomSessions("mogakco");

      expect(sessions).toHaveLength(0);
    });
  });

  describe("getAllSessions", () => {
    it("모든 세션을 반환해야 함", () => {
      service.createSession({ id: "user1" });
      service.createSession({ id: "user2" });
      service.createSession({ id: "user3" });

      const sessions = service.getAllSessions();

      expect(sessions).toHaveLength(3);
    });
  });

  describe("updateSessionPosition", () => {
    it("세션 위치를 업데이트해야 함", () => {
      service.createSession({ id: "user1" });

      const result = service.updateSessionPosition("user1", {
        x: 100,
        y: 200,
        direction: "left",
        state: "walk",
      });

      expect(result).toBe(true);
      const user = service.getSession("user1");
      expect(user?.avatar.x).toBe(100);
      expect(user?.avatar.y).toBe(200);
      expect(user?.avatar.direction).toBe("left");
      expect(user?.avatar.state).toBe("walk");
    });

    it("존재하지 않는 세션 업데이트 시 false를 반환해야 함", () => {
      const result = service.updateSessionPosition("nonexistent", {
        x: 100,
        y: 200,
        direction: "left",
        state: "walk",
      });

      expect(result).toBe(false);
    });

    it("다른 사용자가 앉아있는 위치에 앉으려 하면 false를 반환해야 함", () => {
      service.createSession({ id: "user1" });
      service.createSession({ id: "user2" });

      service.updateSessionPosition("user1", { x: 100, y: 100, direction: "down", state: "sit" });

      const result = service.updateSessionPosition("user2", {
        x: 100,
        y: 100,
        direction: "down",
        state: "sit",
      });

      expect(result).toBe(false);
    });
  });

  describe("updateSessionRoom", () => {
    it("세션 방을 업데이트해야 함", () => {
      service.createSession({ id: "user1" });

      const result = service.updateSessionRoom("user1", "mogakco");

      expect(result).toBe(true);
      const user = service.getSession("user1");
      expect(user?.avatar.currentRoomId).toBe("mogakco");
    });

    it("방 이동 시 메트릭을 기록해야 함", () => {
      service.createSession({ id: "user1" });

      service.updateSessionRoom("user1", "mogakco");

      expect(metricsService.userMoved).toHaveBeenCalledWith("lobby", "mogakco");
    });

    it("desk zone으로 이동 시 deskStatus를 available로 설정해야 함", () => {
      service.createSession({ id: "user1" });

      service.updateSessionRoom("user1", "desk zone");

      const user = service.getSession("user1");
      expect(user?.deskStatus).toBe("available");
    });

    it("desk zone에서 다른 방으로 이동 시 deskStatus를 null로 설정해야 함", () => {
      service.createSession({ id: "user1" });
      service.updateSessionRoom("user1", "desk zone");
      service.updateSessionRoom("user1", "lobby");

      const user = service.getSession("user1");
      expect(user?.deskStatus).toBeNull();
    });

    it("존재하지 않는 세션 업데이트 시 false를 반환해야 함", () => {
      const result = service.updateSessionRoom("nonexistent", "mogakco");

      expect(result).toBe(false);
    });
  });

  describe("updateSessionMedia", () => {
    it("카메라 상태를 업데이트해야 함", () => {
      service.createSession({ id: "user1" });

      const result = service.updateSessionMedia("user1", { cameraOn: true });

      expect(result).toBe(true);
      const user = service.getSession("user1");
      expect(user?.cameraOn).toBe(true);
    });

    it("마이크 상태를 업데이트해야 함", () => {
      service.createSession({ id: "user1" });

      const result = service.updateSessionMedia("user1", { micOn: true });

      expect(result).toBe(true);
      const user = service.getSession("user1");
      expect(user?.micOn).toBe(true);
    });

    it("존재하지 않는 세션 업데이트 시 false를 반환해야 함", () => {
      const result = service.updateSessionMedia("nonexistent", { cameraOn: true });

      expect(result).toBe(false);
    });
  });

  describe("updateSessionContactId", () => {
    it("contactId를 업데이트해야 함", () => {
      service.createSession({ id: "user1" });

      const result = service.updateSessionContactId("user1", "contact123");

      expect(result).toBe(true);
      const user = service.getSession("user1");
      expect(user?.contactId).toBe("contact123");
    });

    it("존재하지 않는 세션 업데이트 시 false를 반환해야 함", () => {
      const result = service.updateSessionContactId("nonexistent", "contact123");

      expect(result).toBe(false);
    });
  });

  describe("updateSessionDeskStatus", () => {
    it("deskStatus를 업데이트해야 함", () => {
      service.createSession({ id: "user1" });

      const result = service.updateSessionDeskStatus("user1", "focusing");

      expect(result).toBe(true);
      const user = service.getSession("user1");
      expect(user?.deskStatus).toBe("focusing");
    });

    it("존재하지 않는 세션 업데이트 시 false를 반환해야 함", () => {
      const result = service.updateSessionDeskStatus("nonexistent", "focusing");
      expect(result).toBe(false);
    });
  });

  describe("deleteSession", () => {
    it("세션을 삭제해야 함", () => {
      service.createSession({ id: "user1" });

      const result = service.deleteSession("user1");

      expect(result).toBe(true);
      expect(service.getSession("user1")).toBeUndefined();
    });

    it("세션 삭제 시 메트릭을 기록해야 함", () => {
      service.createSession({ id: "user1" });

      service.deleteSession("user1");

      expect(metricsService.userLeft).toHaveBeenCalledWith("lobby");
      expect(metricsService.recordSessionDuration).toHaveBeenCalled();
    });

    it("존재하지 않는 세션 삭제 시 false를 반환해야 함", () => {
      const result = service.deleteSession("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("getSessionCount", () => {
    it("세션 개수를 반환해야 함", () => {
      service.createSession({ id: "user1" });
      service.createSession({ id: "user2" });

      expect(service.getSessionCount()).toBe(2);
    });
  });

  describe("getUserCountByRoomType", () => {
    it("방 타입별 사용자 수를 반환해야 함", () => {
      service.createSession({ id: "user1" });
      service.createSession({ id: "user2" });
      service.updateSessionRoom("user2", "mogakco");

      const counts = service.getUserCountByRoomType();

      expect(counts.get("lobby")).toBe(1);
      expect(counts.get("mogakco")).toBe(1);
    });
  });
});
