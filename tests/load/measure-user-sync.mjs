/**
 * USER_SYNC 페이로드 크기 측정 (Node.js + socket.io-client)
 *
 * 측정 대상: room:join 시 서버가 보내는 user:sync 페이로드 크기
 * - Before: users: getAllSessions() (서버 전체 유저 배열 포함)
 * - After:  users 필드 없음, user 객체만
 *
 * 실행:
 *   node tests/load/measure-user-sync.mjs
 *
 * 환경변수:
 *   TARGET=http://localhost:3000  (기본값)
 *   USER_ID=<유효한 userId>
 */

import { io } from "/Users/swoo0514/WebstormProjects/final_naver/apps/client/node_modules/socket.io-client/build/cjs/index.js";

const TARGET = process.env.TARGET || "http://localhost:3000";
const USER_ID = process.env.USER_ID;

if (!USER_ID) {
  console.error("USER_ID 환경변수가 필요합니다.");
  console.error("  USER_ID=<userId> node tests/load/measure-user-sync.mjs");
  process.exit(1);
}

async function main() {
  console.log("서버:", TARGET);
  console.log("USER_ID:", USER_ID);
  console.log("");

  const socket = io(TARGET, {
    auth: { userId: USER_ID },
    transports: ["websocket"],
  });

  await new Promise((resolve, reject) => {
    socket.on("connect_error", reject);
    socket.on("connect", resolve);
    setTimeout(() => reject(new Error("connect timeout")), 8000);
  });

  console.log("소켓 연결 완료. socketId:", socket.id);

  // 초기 접속 USER_SYNC (game.gateway.ts handleConnection)
  const initialSync = await new Promise((resolve) => {
    socket.once("user:sync", resolve);
  });

  const initialPayloadJson = JSON.stringify(initialSync);
  console.log(`[초기 접속 USER_SYNC] ${initialPayloadJson.length}B | users: ${initialSync.users?.length ?? "없음"}명`);

  // room:join 전송 -> 최적화 대상 USER_SYNC 유발
  socket.emit("room:join", { roomId: "lobby" });

  // room:join 이후 USER_SYNC <- 이게 최적화 대상
  const roomJoinSync = await new Promise((resolve) => {
    socket.once("user:sync", resolve);
  });

  const roomJoinPayloadJson = JSON.stringify(roomJoinSync);

  console.log("\n=== room:join USER_SYNC 측정 결과 ===");
  console.log(`  페이로드 크기: ${roomJoinPayloadJson.length} bytes`);
  console.log(`  users[] 포함 여부: ${"users" in roomJoinSync}`);
  console.log(`  users 수: ${roomJoinSync.users?.length ?? 0}명`);
  console.log("=====================================\n");

  socket.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("오류:", e.message);
  process.exit(1);
});
