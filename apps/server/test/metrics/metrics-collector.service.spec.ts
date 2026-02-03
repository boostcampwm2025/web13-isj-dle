import { MetricsCollectorService } from "../../src/metrics/metrics-collector.service";
import { type MetricsService } from "../../src/metrics/metrics.service";
import { type UserService } from "../../src/user/user.service";

describe("MetricsCollectorService", () => {
  let service: MetricsCollectorService;
  let metricsService: jest.Mocked<MetricsService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(() => {
    metricsService = {
      reconcileOnlineUsers: jest.fn(),
      reconcileUsersByRoom: jest.fn(),
      reconcileActiveRooms: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    userService = {
      getSessionCount: jest.fn().mockReturnValue(10),
      getUserCountByRoomType: jest.fn().mockReturnValue(
        new Map([
          ["lobby", 5],
          ["mogakco", 3],
          ["meeting", 2],
        ]),
      ),
      getActiveRoomCountByType: jest.fn().mockReturnValue(
        new Map([
          ["meeting", 2],
          ["mogakco", 1],
        ]),
      ),
    } as unknown as jest.Mocked<UserService>;

    service = new MetricsCollectorService(metricsService, userService);
  });

  describe("reconcileMetrics", () => {
    it("온라인 사용자 수를 reconcile해야 함", () => {
      service.reconcileMetrics();

      expect(userService.getSessionCount).toHaveBeenCalled();
      expect(metricsService.reconcileOnlineUsers).toHaveBeenCalledWith(10);
    });

    it("방별 사용자 수를 reconcile해야 함", () => {
      service.reconcileMetrics();

      expect(userService.getUserCountByRoomType).toHaveBeenCalled();
      expect(metricsService.reconcileUsersByRoom).toHaveBeenCalledWith("lobby", 5);
      expect(metricsService.reconcileUsersByRoom).toHaveBeenCalledWith("mogakco", 3);
      expect(metricsService.reconcileUsersByRoom).toHaveBeenCalledWith("meeting", 2);
    });

    it("활성 방 수를 reconcile해야 함", () => {
      service.reconcileMetrics();

      expect(userService.getActiveRoomCountByType).toHaveBeenCalled();
      expect(metricsService.reconcileActiveRooms).toHaveBeenCalledWith("meeting", 2);
      expect(metricsService.reconcileActiveRooms).toHaveBeenCalledWith("mogakco", 1);
    });

    it("알려진 방 타입 중 사용자가 없는 방은 0으로 reconcile해야 함", () => {
      userService.getUserCountByRoomType.mockReturnValue(new Map([["lobby", 5]]));

      service.reconcileMetrics();

      expect(metricsService.reconcileUsersByRoom).toHaveBeenCalledWith("lobby", 5);
    });

    it("알려진 방 타입 중 활성 방이 없는 타입은 0으로 reconcile해야 함", () => {
      userService.getActiveRoomCountByType.mockReturnValue(new Map());

      service.reconcileMetrics();
    });

    it("에러 발생 시 예외를 던지지 않아야 함", () => {
      userService.getSessionCount.mockImplementation(() => {
        throw new Error("DB error");
      });

      expect(() => service.reconcileMetrics()).not.toThrow();
    });
  });
});
