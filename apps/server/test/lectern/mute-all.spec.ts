/**
 * MUTE_ALL: N번 전역 emit → 1번 방 단위 emit 최적화 비교
 *
 * Before (커밋 5 이전):
 *   - server.to(roomId).emit(MUTE_ALL_EXECUTED, { hostSocketId })         → 1번 (방 단위)
 *   - server.emit(USER_UPDATE, { socketId, micOn: false })                 → N번 (전역, 문제)
 *   총 emit = N + 1번, 전역 브로드캐스트 N번
 *
 * After (커밋 5 이후):
 *   - server.to(roomId).emit(MUTE_ALL_EXECUTED, { hostSocketId, mutedSocketIds[] }) → 1번 (방 단위)
 *   총 emit = 1번, 전역 브로드캐스트 0번
 */
import type { User } from "@shared/types";

const ROOM_ID = "meeting-room-1" as const;

// ─── 유틸 ─────────────────────────────────────────────────────────

function makeUser(socketId: string): Pick<User, "socketId"> {
  return { socketId };
}

function makeServer() {
  const roomEmitFn = jest.fn();
  const globalEmitFn = jest.fn();
  return {
    server: {
      to: jest.fn().mockReturnValue({ emit: roomEmitFn }),
      emit: globalEmitFn,
    },
    roomEmitFn, // server.to(...).emit 호출 추적
    globalEmitFn, // server.emit 호출 추적 (전역 브로드캐스트)
  };
}

type MockServer = ReturnType<typeof makeServer>["server"];

// ─── Before: N번 전역 emit 방식 ───────────────────────────────────

function handleMuteAllBefore(
  server: MockServer,
  hostSocketId: string,
  targetUsers: Pick<User, "socketId">[],
  updateSessionMedia: jest.Mock,
) {
  for (const user of targetUsers) {
    updateSessionMedia(user.socketId, { micOn: false });
  }

  // ❶ 방 단위 MUTE_ALL_EXECUTED (hostSocketId만 포함)
  server.to(ROOM_ID).emit("lectern:mute_all_executed", {
    hostSocketId,
  });

  // ❷ N번 전역 USER_UPDATE — 문제 구간
  for (const user of targetUsers) {
    server.emit("user:update", {
      socketId: user.socketId,
      micOn: false,
    });
  }
}

// ─── After: 1번 방 단위 emit 방식 ────────────────────────────────

function handleMuteAllAfter(
  server: MockServer,
  hostSocketId: string,
  targetUsers: Pick<User, "socketId">[],
  updateSessionMedia: jest.Mock,
) {
  for (const user of targetUsers) {
    updateSessionMedia(user.socketId, { micOn: false });
  }

  // 1번 방 단위 emit — mutedSocketIds 배열 포함
  server.to(ROOM_ID).emit("lectern:mute_all_executed", {
    hostSocketId,
    mutedSocketIds: targetUsers.map((u) => u.socketId),
  });
}

// ─── 테스트 ──────────────────────────────────────────────────────

describe("MUTE_ALL: N번 전역 emit → 1번 방 단위 emit 최적화 비교", () => {
  const perfResults: {
    방식: string;
    "방 인원 (N)": number;
    "총 emit 횟수": number;
    "전역 emit 횟수": number;
    "처리 시간 (ms)": string;
  }[] = [];

  afterAll(() => {
    console.table(perfResults);
  });

  // ── 1. emit 횟수 비교 ────────────────────────────────────────────
  describe("1. emit 횟수 비교", () => {
    const ROOM_SIZES = [10, 30, 50, 100];

    test.each(ROOM_SIZES)("방 인원 %d명", (n) => {
      const targetUsers = Array.from({ length: n }, (_, i) => makeUser(`s${i}`));
      const updateSessionMedia = jest.fn();

      const { server: serverBefore, roomEmitFn: roomBefore, globalEmitFn: globalBefore } = makeServer();
      const { server: serverAfter, roomEmitFn: roomAfter, globalEmitFn: globalAfter } = makeServer();

      handleMuteAllBefore(serverBefore, "host", targetUsers, updateSessionMedia);
      handleMuteAllAfter(serverAfter, "host", targetUsers, jest.fn());

      const totalBefore = roomBefore.mock.calls.length + globalBefore.mock.calls.length;
      const totalAfter = roomAfter.mock.calls.length + globalAfter.mock.calls.length;

      // Before: server.emit N번 + server.to().emit 1번 = N+1번
      expect(globalBefore).toHaveBeenCalledTimes(n);
      expect(roomBefore).toHaveBeenCalledTimes(1);
      expect(totalBefore).toBe(n + 1);

      // After: server.to().emit 1번만
      expect(globalAfter).not.toHaveBeenCalled();
      expect(roomAfter).toHaveBeenCalledTimes(1);
      expect(totalAfter).toBe(1);

      perfResults.push({
        방식: "Before",
        "방 인원 (N)": n,
        "총 emit 횟수": totalBefore,
        "전역 emit 횟수": globalBefore.mock.calls.length,
        "처리 시간 (ms)": "-",
      });
      perfResults.push({
        방식: "After",
        "방 인원 (N)": n,
        "총 emit 횟수": totalAfter,
        "전역 emit 횟수": globalAfter.mock.calls.length,
        "처리 시간 (ms)": "-",
      });
    });
  });

  // ── 2. 처리 시간 비교 ────────────────────────────────────────────
  describe("2. 처리 시간 비교 (1000회 반복)", () => {
    const ROOM_SIZES = [10, 50, 100, 300];
    const ITERATIONS = 1000;

    test.each(ROOM_SIZES)("방 인원 %d명", (n) => {
      const targetUsers = Array.from({ length: n }, (_, i) => makeUser(`s${i}`));

      // Before 측정
      const { server: serverBefore } = makeServer();
      const startBefore = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        handleMuteAllBefore(serverBefore, "host", targetUsers, jest.fn());
      }
      const msBefore = performance.now() - startBefore;

      // After 측정
      const { server: serverAfter } = makeServer();
      const startAfter = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        handleMuteAllAfter(serverAfter, "host", targetUsers, jest.fn());
      }
      const msAfter = performance.now() - startAfter;

      const improvementPct = ((1 - msAfter / msBefore) * 100).toFixed(1);

      // 결과 기록 (기존 행 업데이트 대신 새 행으로 추가)
      perfResults.push({
        방식: `Before (${ITERATIONS}회)`,
        "방 인원 (N)": n,
        "총 emit 횟수": n + 1,
        "전역 emit 횟수": n,
        "처리 시간 (ms)": msBefore.toFixed(2),
      });
      perfResults.push({
        방식: `After  (${ITERATIONS}회)`,
        "방 인원 (N)": n,
        "총 emit 횟수": 1,
        "전역 emit 횟수": 0,
        "처리 시간 (ms)": `${msAfter.toFixed(2)} (↓${improvementPct}%)`,
      });

      // After가 Before보다 느려서는 안 됨 (여유 있게 3배 이내)
      expect(msAfter).toBeLessThanOrEqual(msBefore * 3);
    });
  });

  // ── 3. After 페이로드 정확성 ─────────────────────────────────────
  describe("3. After 페이로드 정확성", () => {
    it("mutedSocketIds에 호스트 자신은 포함되지 않는다", () => {
      const hostSocketId = "host-socket";
      // targetUsers는 이미 호스트가 필터링된 상태 (lectern.gateway.ts:51 참고)
      const targetUsers = [makeUser("s1"), makeUser("s2"), makeUser("s3")];
      const { server, roomEmitFn } = makeServer();

      handleMuteAllAfter(server, hostSocketId, targetUsers, jest.fn());

      const payload = roomEmitFn.mock.calls[0][1] as {
        hostSocketId: string;
        mutedSocketIds: string[];
      };

      expect(payload.mutedSocketIds).not.toContain(hostSocketId);
      expect(payload.mutedSocketIds).toEqual(["s1", "s2", "s3"]);
    });

    it("emit 대상이 roomId 방으로 한정된다", () => {
      const targetUsers = [makeUser("s1"), makeUser("s2")];
      const { server } = makeServer();

      handleMuteAllAfter(server, "host", targetUsers, jest.fn());

      expect(server.to).toHaveBeenCalledWith(ROOM_ID);
      expect(server.emit).not.toHaveBeenCalled();
    });

    it("대상이 0명이면 mutedSocketIds가 빈 배열이다", () => {
      const { server, roomEmitFn } = makeServer();

      handleMuteAllAfter(server, "host", [], jest.fn());

      const payload = roomEmitFn.mock.calls[0][1] as { mutedSocketIds: string[] };
      expect(payload.mutedSocketIds).toEqual([]);
    });

    it("updateSessionMedia가 대상자 전원에 대해 micOn: false로 호출된다", () => {
      const targetUsers = [makeUser("s1"), makeUser("s2"), makeUser("s3")];
      const { server } = makeServer();
      const updateSessionMedia = jest.fn();

      handleMuteAllAfter(server, "host", targetUsers, updateSessionMedia);

      expect(updateSessionMedia).toHaveBeenCalledTimes(3);
      for (const user of targetUsers) {
        expect(updateSessionMedia).toHaveBeenCalledWith(user.socketId, { micOn: false });
      }
    });
  });
});
