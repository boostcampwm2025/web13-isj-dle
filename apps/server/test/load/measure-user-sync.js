/**
 * USER_SYNC 페이로드 크기 측정 (k6)
 *
 * 측정 대상: room:join 시 서버가 보내는 user:sync 페이로드 크기
 * - Before: users: getAllSessions() (서버 전체 유저 배열)
 * - After:  users 필드 없음, user 객체만
 *
 * 실행:
 *   k6 run tests/load/measure-user-sync.js -e USER_ID=1
 *
 * 결과 기록 위치: tests/load/results/
 */

import ws from "k6/ws";
import { check } from "k6";

export const options = {
  vus: 1,
  iterations: 1,
};

const TARGET = __ENV.TARGET || "http://localhost:3000";
const USER_ID = __ENV.USER_ID || "1";

export default function () {
  const wsUrl = TARGET.replace(/^http/, "ws") + "/socket.io/?EIO=4&transport=websocket";

  let phase = "init";

  const res = ws.connect(wsUrl, {}, function (socket) {
    socket.on("open", () => {
      socket.send("40" + JSON.stringify({ auth: { userId: USER_ID } }));
    });

    socket.on("message", (data) => {
      if (data === "2") {
        socket.send("3");
        return;
      }
      if (!data.startsWith("42")) return;

      const parsed = JSON.parse(data.slice(2));
      const event = parsed[0];
      const payload = parsed[1];

      if (event === "user:sync") {
        if (phase === "init") {
          phase = "connected";
          console.log(`[초기 접속 USER_SYNC] ${data.length}B | users: ${payload.users?.length ?? "없음"}명`);
          // room:join 전송 -> 최적화 대상 USER_SYNC 유발
          socket.send("42" + JSON.stringify(["room:join", { roomId: "lobby" }]));
        } else if (phase === "connected") {
          // room:join 이후 user:sync <- 이게 최적화 대상
          phase = "measured";

          console.log("\n=== room:join USER_SYNC 측정 결과 ===");
          console.log(`  페이로드 크기: ${data.length} bytes`);
          console.log(`  users[] 포함 여부: ${"users" in payload}`);
          console.log(`  users 수: ${payload.users?.length ?? 0}명`);
          console.log("=====================================\n");

          socket.close();
        }
      }
    });

    socket.setTimeout(() => {
      if (phase !== "measured") {
        console.log("타임아웃. 서버 실행 여부 및 USER_ID 유효성 확인 필요. (k6 run ... -e USER_ID=<유효한 userId>)");
      }
      socket.close();
    }, 15000);
  });

  check(res, { "WebSocket 연결 성공": (r) => r && r.status === 101 });
}
