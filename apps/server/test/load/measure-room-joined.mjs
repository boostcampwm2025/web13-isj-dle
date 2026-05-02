/**
 * ROOM_JOINED 수신 범위 측정 (Node.js + socket.io-client)
 *
 * 측정 대상: room:join 시 ROOM_JOINED 이벤트가 엉뚱한 방 유저에게도 오는지
 * - Before: 전역 브로드캐스트 -> 다른 방 유저도 수신
 * - After:  방 단위 emit -> 다른 방 유저는 수신 안 함
 *
 * 실행:
 *   node test/load/measure-room-joined.mjs
 *
 * 환경변수:
 *   TARGET=http://localhost:3000   (기본값)
 *   USER_A=1  USER_B=2  USER_C=3  (각각 유효한 userId)
 */

import { io } from "socket.io-client";

const TARGET = process.env.TARGET || "http://localhost:3000";
const USER_A = process.env.USER_A || "1"; // meeting-1 상주 (참여자)
const USER_B = process.env.USER_B || "2"; // meeting-2 상주 (관찰자 - 받으면 안 됨)
const USER_C = process.env.USER_C || "3"; // meeting-1에 새로 입장

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
  return new Promise((resolve) => {
    socket.once("user:sync", resolve);
  });
}

async function main() {
  console.log("서버:", TARGET);
  console.log("USER_A (meeting-1 상주):", USER_A);
  console.log("USER_B (meeting-2 상주 / 관찰자):", USER_B);
  console.log("USER_C (meeting-1 신규 입장):", USER_C);
  console.log("");

  let socketA, socketB, socketC;

  try {
    socketA = await connect(USER_A);
    await waitForSync(socketA);
    socketA.emit("room:join", { roomId: "meeting-1" });
    await new Promise((r) => setTimeout(r, 500));
    console.log("A: meeting-1 입장 완료");

    socketB = await connect(USER_B);
    await waitForSync(socketB);
    socketB.emit("room:join", { roomId: "meeting-2" });
    await new Promise((r) => setTimeout(r, 500));
    console.log("B: meeting-2 입장 완료 (관찰자)");

    // B가 room:joined 수신하는지 카운트
    let bReceivedCount = 0;
    socketB.on("room:joined", () => {
      bReceivedCount++;
      console.log(`  B가 room:joined 수신! (누적 ${bReceivedCount}회) <- Before라면 전역 브로드캐스트`);
    });

    socketC = await connect(USER_C);
    await waitForSync(socketC);
    console.log("\nC가 meeting-1에 입장...");
    socketC.emit("room:join", { roomId: "meeting-1" });

    await new Promise((r) => setTimeout(r, 2000));

    console.log("\n=== ROOM_JOINED 수신 범위 측정 결과 ===");
    console.log(`  B(meeting-2)가 room:joined 수신 횟수: ${bReceivedCount}회`);
    if (bReceivedCount > 0) {
      console.log("  -> [Before] 전역 브로드캐스트 확인됨");
    } else {
      console.log("  -> [After] 방 단위 emit 확인됨 (B는 수신 안 함)");
    }
    console.log("========================================\n");
  } catch (e) {
    console.error("오류:", e.message);
    console.error("서버가 실행 중인지, USER_A/B/C 가 유효한 userId인지 확인하세요.");
  } finally {
    socketA?.disconnect();
    socketB?.disconnect();
    socketC?.disconnect();
    process.exit(0);
  }
}

main();
