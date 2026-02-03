// Yjs WebSocket 부하테스트
// 서버 스펙: mi1-g3 (1vCPU, 1GB RAM, 2GB Swap)
// 목적: 코드 에디터 동시 사용 시 서버 부하 측정 (일반 회의 시나리오)

import ws from "k6/ws";
import { check, sleep } from "k6";
import { Counter, Trend, Rate } from "k6/metrics";

// 커스텀 메트릭
const messagesReceived = new Counter("yjs_messages_received");
const messagesSent = new Counter("yjs_messages_sent");
const connectionTime = new Trend("yjs_connection_time");
const connectionFailRate = new Rate("yjs_connection_failed");
const syncLatency = new Trend("yjs_sync_latency");

export const options = {
  // 일반 회의 시나리오: 4-20명 동시 편집
  stages: [
    { duration: "20s", target: 5 }, // Warm up: 0 → 5 VU
    { duration: "40s", target: 15 }, // Ramp up: 5 → 15 VU
    { duration: "30s", target: 20 }, // Peak: 15 → 20 VU
    { duration: "20s", target: 0 }, // Cool down: 20 → 0 VU
  ],
  thresholds: {
    yjs_connection_time: ["p(95)<2000"], // 연결 시간 p95 < 2초
    yjs_connection_failed: ["rate<0.1"], // 연결 실패율 < 10%
    yjs_sync_latency: ["p(95)<500"], // 동기화 지연 p95 < 500ms
    checks: ["rate>0.9"], // 체크 성공률 > 90%
  },
  tags: {
    testType: "websocket",
    target: "yjs",
    scenario: "meeting",
    server: "mi1-g3",
  },
};

const BASE_URL = __ENV.WS_URL || "ws://localhost:3000";

// Yjs WebSocket roomName 형식: code-editor-{sanitizedRoomId}
const ROOM_NAMES = [
  "code-editor-lobby",
  "code-editor-mogakco",
  "code-editor-meeting-web-1-10",
  "code-editor-meeting-web-11-20",
];

export default function () {
  const roomName = ROOM_NAMES[__VU % ROOM_NAMES.length];
  const url = `${BASE_URL}/yjs/${roomName}`;

  const connectStart = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    const connectDuration = Date.now() - connectStart;
    connectionTime.add(connectDuration);

    socket.on("open", () => {
      // Yjs MESSAGE_SYNC (type: 0) - 초기 동기화 요청
      socket.sendBinary(new Uint8Array([0, 0]).buffer);
      messagesSent.add(1);
    });

    socket.on("binaryMessage", (data) => {
      messagesReceived.add(1);

      // 동기화 지연 시간 측정 (간단한 근사치)
      const latency = Date.now() - connectStart;
      if (latency > 0 && latency < 10000) {
        syncLatency.add(latency);
      }
    });

    socket.on("error", (e) => {
      const errorMsg = e.error();
      // 정상 종료 메시지는 실패로 카운트하지 않음
      if (errorMsg !== "websocket: close sent") {
        console.log(`VU ${__VU}: Real Error - ${errorMsg}`);
        connectionFailRate.add(1);
      }
    });

    // 30초간 연결 유지하며 동시 편집 시뮬레이션
    for (let i = 0; i < 30; i++) {
      const action = Math.random();

      if (action < 0.7) {
        // 70%: Awareness 업데이트 (커서 이동)
        socket.sendBinary(new Uint8Array([1, i % 256]).buffer);
        messagesSent.add(1);
      } else {
        // 30%: Sync 메시지 (텍스트 편집)
        socket.sendBinary(new Uint8Array([0, i % 256, (i * 2) % 256]).buffer);
        messagesSent.add(1);
      }

      sleep(1);
    }

    socket.close();
  });

  const connected = check(res, {
    "Yjs WebSocket connected": (r) => r && r.status === 101,
  });

  if (!connected) {
    connectionFailRate.add(1);
  }
}
