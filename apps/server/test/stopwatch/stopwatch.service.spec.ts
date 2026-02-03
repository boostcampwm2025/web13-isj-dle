import { StopwatchService } from "../../src/stopwatch/stopwatch.service";

describe("StopwatchService", () => {
  let service: StopwatchService;

  beforeEach(() => {
    service = new StopwatchService();
  });

  describe("getRoomStates", () => {
    it("존재하지 않는 방은 빈 users 배열을 반환해야 함", () => {
      const result = service.getRoomStates("mogakco");

      expect(result).toEqual({ users: [] });
    });
  });

  describe("updateUserState", () => {
    it("사용자 상태를 추가하고 방 상태를 반환해야 함", () => {
      const stopwatch = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };

      const result = service.updateUserState("mogakco", "user1", "테스트유저", stopwatch, timer);

      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toEqual({
        userId: "user1",
        nickname: "테스트유저",
        stopwatch,
        timer,
      });
    });

    it("여러 사용자의 상태를 관리할 수 있어야 함", () => {
      const stopwatch1 = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer1 = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };

      const stopwatch2 = { isRunning: false, startedAt: null, pausedTimeSec: 300 };
      const timer2 = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };

      service.updateUserState("mogakco", "user1", "유저1", stopwatch1, timer1);
      const result = service.updateUserState("mogakco", "user2", "유저2", stopwatch2, timer2);

      expect(result.users).toHaveLength(2);
    });

    it("같은 사용자의 상태를 업데이트할 수 있어야 함", () => {
      const stopwatch1 = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };

      service.updateUserState("mogakco", "user1", "테스트유저", stopwatch1, timer);

      const stopwatch2 = { isRunning: false, startedAt: null, pausedTimeSec: 120 };
      const result = service.updateUserState("mogakco", "user1", "테스트유저", stopwatch2, timer);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].stopwatch.pausedTimeSec).toBe(120);
    });

    it("빈 상태이면 사용자를 제거해야 함", () => {
      const stopwatch = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };

      service.updateUserState("mogakco", "user1", "테스트유저", stopwatch, timer);

      const emptyStopwatch = { isRunning: false, startedAt: null, pausedTimeSec: 0 };
      const emptyTimer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };
      const result = service.updateUserState("mogakco", "user1", "테스트유저", emptyStopwatch, emptyTimer);

      expect(result.users).toHaveLength(0);
    });
  });

  describe("removeUser", () => {
    it("사용자를 제거하고 방 상태를 반환해야 함", () => {
      const stopwatch = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };

      service.updateUserState("mogakco", "user1", "유저1", stopwatch, timer);
      service.updateUserState("mogakco", "user2", "유저2", stopwatch, timer);

      const result = service.removeUser("mogakco", "user1");

      expect(result.users).toHaveLength(1);
      expect(result.users[0].userId).toBe("user2");
    });

    it("존재하지 않는 사용자 제거 시 에러 없이 처리해야 함", () => {
      const result = service.removeUser("mogakco", "unknown-user");

      expect(result).toEqual({ users: [] });
    });

    it("존재하지 않는 방에서 사용자 제거 시 빈 배열을 반환해야 함", () => {
      const result = service.removeUser("lobby", "user1");

      expect(result).toEqual({ users: [] });
    });
  });

  describe("deleteRoom", () => {
    it("방을 삭제하면 해당 방의 모든 상태가 제거되어야 함", () => {
      const stopwatch = { isRunning: true, startedAt: Date.now(), pausedTimeSec: 0 };
      const timer = { isRunning: false, startedAt: null, pausedTimeSec: 0, initialTimeSec: 0 };

      service.updateUserState("mogakco", "user1", "유저1", stopwatch, timer);
      service.updateUserState("mogakco", "user2", "유저2", stopwatch, timer);

      service.deleteRoom("mogakco");

      const result = service.getRoomStates("mogakco");
      expect(result.users).toHaveLength(0);
    });
  });
});
