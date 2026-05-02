/**
 * MUTE_ALL emit 방식 측정 (Node.js + socket.io-client)
 *
 * 측정 대상: lectern:mute-all 시 서버가 보내는 이벤트 수 및 수신 범위
 * - Before: server.emit(user:update) N번 (전역) + lectern:mute-all-executed 1번
 *           → 다른 방 유저도 user:update 수신
 * - After:  server.to(roomId).emit(lectern:mute-all-executed, { mutedSocketIds[] }) 1번
 *           → 다른 방 유저는 수신 없음
 *
 * 실행:
 *   node test/load/measure-mute-all.mjs
 *
 * 환경변수:
 *   TARGET=http://localhost:3000        기본값
 *   HOST_ID=1      lectern 호스트로 쓸 userId
 *   MEMBER_ID=2    참여자로 쓸 userId (N명 연결, 세션은 socketId 기준이라 중복 가능)
 *   MEMBER_COUNT=10  meeting-1 참여자 수  기본값 10
 *   OBSERVER_ID=3  meeting-2 관찰자 userId (Before에서 user:update를 수신하면 안 됨)
 *
 * Before/After Prometheus 비교:
 *   Before 서버: socket_events_total{event_name="user:update",direction="outbound"} = MEMBER_COUNT
 *   After 서버:  socket_events_total{event_name="user:update",direction="outbound"} = 0
 *               socket_events_total{event_name="lectern:mute-all-executed",direction="outbound"} = 1
 */

import { io } from "socket.io-client";

const TARGET = process.env.TARGET || "http://localhost:3000";
const HOST_ID = process.env.HOST_ID || "1";
const MEMBER_ID = process.env.MEMBER_ID || "2";
const MEMBER_COUNT = parseInt(process.env.MEMBER_COUNT || "10", 10);
const OBSERVER_ID = process.env.OBSERVER_ID || "3";

const ROOM_ID = "meeting-1";
const OBSERVER_ROOM = "meeting-2";

function connect(userId) {
  return new Promise((resolve, reject) => {
    const socket = io(TARGET, {
      auth: { userId },
      transports: ["websocket"],
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
    setTimeout(() => reject(new Error(`connect timeout userId=${userId}`)), 8000);
  });
}

function waitForSync(socket) {
  return new Promise((resolve) => socket.once("user:sync", resolve));
}

function waitForAck(socket, event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (ack) => resolve(ack));
    setTimeout(() => resolve(null), 2000);
  });
}

async function fetchPrometheus(metric) {
  const res = await fetch(`${TARGET}/metrics`);
  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.includes(metric) && !l.startsWith("#"));
  return lines;
}

async function main() {
  console.log(`서버: ${TARGET}`);
  console.log(`HOST    (meeting-1 호스트): userId=${HOST_ID}`);
  console.log(`MEMBER  (meeting-1 참여자): userId=${MEMBER_ID} × ${MEMBER_COUNT}명`);
  console.log(`OBSERVER(meeting-2 관찰자): userId=${OBSERVER_ID}`);
  console.log("");

  const allSockets = [];
  let socketHost, socketObserver;
  const memberSockets = [];

  try {
    // ── 접속 ──────────────────────────────────────────────────────
    process.stdout.write("접속 중");
    socketHost = await connect(HOST_ID);
    await waitForSync(socketHost);
    allSockets.push(socketHost);
    process.stdout.write(".");

    socketObserver = await connect(OBSERVER_ID);
    await waitForSync(socketObserver);
    allSockets.push(socketObserver);
    process.stdout.write(".");

    for (let i = 0; i < MEMBER_COUNT; i++) {
      const s = await connect(MEMBER_ID);
      await waitForSync(s);
      memberSockets.push(s);
      allSockets.push(s);
      process.stdout.write(".");
    }
    console.log(` 완료 (총 ${allSockets.length}명)`);

    // ── 방 입장 ───────────────────────────────────────────────────
    await waitForAck(socketHost, "room:join", { roomId: ROOM_ID });
    await waitForAck(socketObserver, "room:join", { roomId: OBSERVER_ROOM });
    for (const s of memberSockets) {
      await waitForAck(s, "room:join", { roomId: ROOM_ID });
    }
    await new Promise((r) => setTimeout(r, 500));
    console.log(`방 입장 완료 — meeting-1: HOST+${MEMBER_COUNT}명 / meeting-2: OBSERVER 1명`);

    // ── lectern 진입 (호스트 등록) ───────────────────────────────
    socketHost.emit("lectern:enter", { roomId: ROOM_ID });
    await new Promise((r) => setTimeout(r, 500));
    console.log("HOST: lectern 진입 완료\n");

    // ── 수신 카운터 세팅 ──────────────────────────────────────────
    let observerUserUpdateCount = 0;
    let memberUserUpdateTotal = 0;
    let muteAllExecutedCount = 0;
    let lastMuteAllPayload = null;

    socketObserver.on("user:update", () => {
      observerUserUpdateCount++;
    });
    for (const s of memberSockets) {
      s.on("user:update", () => memberUserUpdateTotal++);
    }
    socketHost.on("lectern:mute-all-executed", (data) => {
      muteAllExecutedCount++;
      lastMuteAllPayload = data;
    });

    // ── Prometheus 기준값 스냅샷 ──────────────────────────────────
    const beforeMetrics = await fetchPrometheus("socket_events_total");
    console.log("[Prometheus — 발송 전]");
    if (beforeMetrics.length === 0) console.log("  (없음)");
    beforeMetrics.forEach((l) => console.log(" ", l));
    console.log("");

    // ── MUTE_ALL 발송 ─────────────────────────────────────────────
    console.log(`lectern:mute-all 발송 → 대상 ${MEMBER_COUNT}명...`);
    const ack = await waitForAck(socketHost, "lectern:mute-all", { roomId: ROOM_ID });
    console.log("  ack:", ack);

    await new Promise((r) => setTimeout(r, 1500));

    // ── Prometheus 발송 후 스냅샷 ─────────────────────────────────
    const afterMetrics = await fetchPrometheus("socket_events_total");
    console.log("\n[Prometheus — 발송 후]");
    afterMetrics.forEach((l) => console.log(" ", l));

    // ── 결과 출력 ─────────────────────────────────────────────────
    const hasNewPayload = lastMuteAllPayload?.mutedSocketIds !== undefined;

    console.log("\n=== MUTE_ALL emit 방식 측정 결과 ===");
    console.log(`\n[클라이언트 수신]`);
    console.log(`  OBSERVER user:update 수신:     ${observerUserUpdateCount}회  ← 0이어야 After`);
    console.log(`  MEMBER   user:update 수신 합계: ${memberUserUpdateTotal}회`);
    console.log(`  mute-all-executed 수신:         ${muteAllExecutedCount}회`);
    console.log(`  mutedSocketIds[] 포함:          ${hasNewPayload}`);
    if (hasNewPayload) {
      console.log(`  mutedSocketIds 수:              ${lastMuteAllPayload.mutedSocketIds.length}명`);
    }

    console.log(`\n[판정]`);
    if (observerUserUpdateCount > 0) {
      console.log(`  → [Before] 전역 브로드캐스트 — OBSERVER가 user:update ${observerUserUpdateCount}회 수신`);
    } else if (hasNewPayload) {
      console.log(`  → [After]  방 단위 emit — OBSERVER 수신 없음 ✓, mutedSocketIds[] 포함 ✓`);
    } else {
      console.log(`  → [Before] 방 단위 emit이지만 mutedSocketIds[] 없음`);
    }
    console.log("=====================================\n");
  } catch (e) {
    console.error("오류:", e.message);
  } finally {
    allSockets.forEach((s) => s?.disconnect());
    process.exit(0);
  }
}

main();
