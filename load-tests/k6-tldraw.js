// Tldraw 화이트보드 부하테스트
// 서버 스펙: mi1-g3 (1vCPU, 1GB RAM, 2GB Swap)
// 목적: @tldraw/sync 기반 화이트보드 동시 사용 시 서버 부하 측정

import ws from "k6/ws";
import { check, sleep } from "k6";
import { Counter, Trend, Rate } from "k6/metrics";

// 커스텀 메트릭
const messagesReceived = new Counter("tldraw_messages_received");
const messagesSent = new Counter("tldraw_messages_sent");
const connectionTime = new Trend("tldraw_connection_time");
const connectionFailRate = new Rate("tldraw_connection_failed");
const syncLatency = new Trend("tldraw_sync_latency");

export const options = {
  // 서버 스펙(1vCPU, 1GB)에 맞춰 보수적으로 설정
  stages: [
    { duration: "20s", target: 5 }, // Warm up: 0 → 5 VU
    { duration: "40s", target: 15 }, // Ramp up: 5 → 15 VU
    { duration: "30s", target: 20 }, // Peak: 15 → 20 VU
    { duration: "20s", target: 0 }, // Cool down: 20 → 0 VU
  ],
  thresholds: {
    tldraw_connection_time: ["p(95)<2000"], // 연결 시간 p95 < 2초
    tldraw_connection_failed: ["rate<0.1"], // 연결 실패율 < 10%
    tldraw_sync_latency: ["p(95)<500"], // 동기화 지연 p95 < 500ms
    checks: ["rate>0.9"], // 체크 성공률 > 90%
  },
  tags: {
    testType: "websocket",
    target: "tldraw",
    server: "mi1-g3",
  },
};

const BASE_URL = __ENV.WS_URL || "ws://localhost:3000";

// Tldraw 방 목록
const ROOM_IDS = ["whiteboard-lobby", "whiteboard-meeting-1", "whiteboard-mogakco"];

// 도형 타입
const SHAPE_TYPES = ["geo", "draw", "arrow", "text", "note"];
const GEO_TYPES = ["rectangle", "ellipse", "triangle", "diamond"];
const COLORS = ["black", "blue", "red", "green", "orange", "violet"];

// 랜덤 도형 생성
function generateRandomShape(userId, index) {
  const shapeType = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
  const shapeId = `shape:${userId}-${index}-${Date.now()}`;

  const baseShape = {
    typeName: "shape",
    id: shapeId,
    type: shapeType,
    x: Math.random() * 1000,
    y: Math.random() * 800,
    rotation: 0,
    isLocked: false,
    opacity: 1,
  };

  switch (shapeType) {
    case "geo":
      return {
        ...baseShape,
        props: {
          geo: GEO_TYPES[Math.floor(Math.random() * GEO_TYPES.length)],
          w: 50 + Math.random() * 150,
          h: 50 + Math.random() * 150,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          fill: "none",
          dash: "draw",
          size: "m",
        },
      };
    case "draw":
      return {
        ...baseShape,
        props: {
          segments: [
            {
              type: "free",
              points: generateFreehandPoints(),
            },
          ],
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          fill: "none",
          dash: "draw",
          size: "m",
          isComplete: true,
          isClosed: false,
          isPen: false,
        },
      };
    case "arrow":
      return {
        ...baseShape,
        props: {
          start: { type: "point", x: 0, y: 0 },
          end: { type: "point", x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          fill: "none",
          dash: "draw",
          size: "m",
          arrowheadStart: "none",
          arrowheadEnd: "arrow",
        },
      };
    case "text":
      return {
        ...baseShape,
        props: {
          text: `Text ${Math.random().toString(36).substring(2, 7)}`,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: "m",
          font: "draw",
          align: "middle",
          autoSize: true,
          w: 100,
        },
      };
    case "note":
      return {
        ...baseShape,
        props: {
          text: `Note ${index}`,
          color: "yellow",
          size: "m",
          font: "draw",
          align: "middle",
          verticalAlign: "middle",
          growY: 0,
        },
      };
    default:
      return baseShape;
  }
}

// 프리핸드 그리기 포인트 생성
function generateFreehandPoints() {
  const points = [];
  const numPoints = 10 + Math.floor(Math.random() * 30);
  let x = 0;
  let y = 0;

  for (let i = 0; i < numPoints; i++) {
    x += (Math.random() - 0.5) * 30;
    y += (Math.random() - 0.5) * 30;
    points.push({ x, y, z: 0.5 });
  }

  return points;
}

// Tldraw sync 메시지 생성
function createPushMessage(shape, clientClock) {
  return JSON.stringify({
    type: "push",
    clientClock: clientClock,
    diff: {
      [shape.id]: [null, shape], // [oldValue, newValue] - 새 도형 추가
    },
  });
}

// 도형 업데이트 메시지 생성
function createUpdateMessage(shapeId, updates, clientClock) {
  return JSON.stringify({
    type: "push",
    clientClock: clientClock,
    diff: {
      [shapeId]: [updates, { ...updates, ...{ x: updates.x + 10, y: updates.y + 10 } }],
    },
  });
}

export default function () {
  const roomId = ROOM_IDS[__VU % ROOM_IDS.length];
  const userId = `tldraw-user-${__VU}-${__ITER}`;
  const sessionId = `session-${userId}`;
  const url = `${BASE_URL}/tldraw/${roomId}?sessionId=${sessionId}`;

  const connectStart = Date.now();
  let clientClock = 0;
  let shapeCount = 0;
  const createdShapes = [];

  const res = ws.connect(url, {}, function (socket) {
    const connectDuration = Date.now() - connectStart;
    connectionTime.add(connectDuration);

    socket.on("open", () => {
      console.log(`VU ${__VU}: Connected to tldraw room ${roomId}`);
    });

    socket.on("message", (data) => {
      messagesReceived.add(1);

      try {
        const message = JSON.parse(data);

        // 서버에서 받은 push_result로 동기화 지연 측정
        if (message.type === "push_result") {
          const latency = Date.now() - message.clientClock;
          if (latency > 0 && latency < 10000) {
            syncLatency.add(latency);
          }
        }
      } catch (e) {
        // 바이너리 메시지 무시
      }
    });

    socket.on("error", (e) => {
      const errorMsg = e.error();
      if (errorMsg !== "websocket: close sent") {
        console.log(`VU ${__VU}: Real Error - ${errorMsg}`);
        connectionFailRate.add(1);
      }
    });

    // 30초간 연결 유지하며 도형 생성/수정
    for (let i = 0; i < 30; i++) {
      const action = Math.random();
      clientClock = Date.now();

      if (action < 0.6 || createdShapes.length === 0) {
        // 60%: 새 도형 생성
        const shape = generateRandomShape(userId, shapeCount++);
        createdShapes.push(shape);
        socket.send(createPushMessage(shape, clientClock));
        messagesSent.add(1);
      } else if (action < 0.9) {
        // 30%: 기존 도형 이동
        const randomShape = createdShapes[Math.floor(Math.random() * createdShapes.length)];
        socket.send(createUpdateMessage(randomShape.id, randomShape, clientClock));
        messagesSent.add(1);
      }
      // 10%: 대기 (아무것도 안 함)

      sleep(1);
    }

    socket.close();
  });

  const connected = check(res, {
    "Tldraw WebSocket connected": (r) => r && r.status === 101,
  });

  if (!connected) {
    connectionFailRate.add(1);
  }
}

// 대규모 캔버스 테스트 (별도 시나리오)
// k6 run --env SCENARIO=heavy k6-tldraw.js
export function heavyCanvasTest() {
  const roomId = "whiteboard-heavy-test";
  const userId = `heavy-user-${__VU}`;
  const url = `${BASE_URL}/tldraw/${roomId}?sessionId=session-${userId}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on("open", () => {
      console.log(`VU ${__VU}: Heavy canvas test - creating 50 shapes`);

      // 한 번에 50개 도형 생성 (대용량 캔버스 시뮬레이션)
      for (let i = 0; i < 50; i++) {
        const shape = generateRandomShape(userId, i);
        socket.send(createPushMessage(shape, Date.now()));
        messagesSent.add(1);
      }
    });

    socket.on("message", () => {
      messagesReceived.add(1);
    });

    // 60초간 연결 유지
    sleep(60);
    socket.close();
  });

  check(res, {
    "Heavy canvas connected": (r) => r && r.status === 101,
  });
}
