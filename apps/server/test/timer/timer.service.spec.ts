import { TimerService } from "src/timer/timer.service";

describe("TimerService", () => {
  test("getTimerState: 처음 호출 시 기본 상태 반환", () => {
    const service = new TimerService();
    const roomId = "meeting (web 1)";

    const state = service.getTimerState(roomId);

    expect(state).toEqual({
      isRunning: false,
      initialTimeSec: 0,
      startedAt: null,
      pausedTimeSec: 0,
    });
  });

  test("startTimer: 실행 상태로 전환하고 pausedTimeSec를 0으로 만듦", () => {
    const service = new TimerService();
    const roomId = "meeting (web 1)";
    const startedAt = Date.now();

    const state = service.startTimer(roomId, 120, startedAt);

    expect(state).toEqual({
      isRunning: true,
      initialTimeSec: 120,
      startedAt,
      pausedTimeSec: 0,
    });
  });

  test("pauseTimer: 정지 상태로 전환하고 startedAt을 null로 만듦", () => {
    const service = new TimerService();
    const roomId = "meeting (web 1)";
    service.startTimer(roomId, 120, Date.now());

    const state = service.pauseTimer(roomId, 77);

    expect(state).toEqual({
      isRunning: false,
      initialTimeSec: 120,
      startedAt: null,
      pausedTimeSec: 77,
    });
  });

  test("resetTimer: 타이머 상태를 완전히 초기화", () => {
    const service = new TimerService();
    const roomId = "meeting (web 1)";
    service.startTimer(roomId, 120, Date.now());
    service.pauseTimer(roomId, 50);

    const state = service.resetTimer(roomId);

    expect(state).toEqual({
      isRunning: false,
      initialTimeSec: 0,
      startedAt: null,
      pausedTimeSec: 0,
    });
  });

  test("addTime: 멈춘 상태에서는 pausedTimeSec(및 initialTimeSec) 증가", () => {
    const service = new TimerService();
    const roomId = "meeting (web 1)";

    service.pauseTimer(roomId, 10);
    const next = service.addTime(roomId, 5);

    expect(next.isRunning).toBe(false);
    expect(next.startedAt).toBeNull();
    expect(next.pausedTimeSec).toBe(15);
    expect(next.initialTimeSec).toBe(15);
  });

  test("addTime: 실행 중에는 initialTimeSec 증가", () => {
    const service = new TimerService();
    const roomId = "meeting (web 1)";

    service.startTimer(roomId, 10, Date.now());
    const next = service.addTime(roomId, 5);

    expect(next.isRunning).toBe(true);
    expect(next.initialTimeSec).toBe(15);
  });

  test("addTime: 음수 추가는 0 미만으로 내려가지 않음", () => {
    const service = new TimerService();
    const roomId = "meeting (web 1)";

    service.pauseTimer(roomId, 3);
    const state = service.addTime(roomId, -10);

    expect(state.isRunning).toBe(false);
    expect(state.pausedTimeSec).toBe(0);
    expect(state.initialTimeSec).toBe(0);
  });

  test("deleteTimer: 삭제 후 getTimerState는 기본 상태로 돌아감", () => {
    const service = new TimerService();
    const roomId = "meeting (web 1)";
    service.startTimer(roomId, 10, Date.now());

    service.deleteTimer(roomId);
    const state = service.getTimerState(roomId);

    expect(state).toEqual({
      isRunning: false,
      initialTimeSec: 0,
      startedAt: null,
      pausedTimeSec: 0,
    });
  });
});
