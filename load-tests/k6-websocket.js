import ws from "k6/ws";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

// 커스텀 메트릭
const messagesReceived = new Counter("messages_received");
const messagesSent = new Counter("messages_sent");
const connectionTime = new Trend("connection_time");

export const options = {
  stages: [
    { duration: "20s", target: 10 },
    { duration: "1m", target: 30 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    connection_time: ["p(95)<1000"],
  },
};

const BASE_URL = __ENV.WS_URL || "ws://localhost:3000";

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
    connectionTime.add(Date.now() - connectStart);

    socket.on("open", () => {
      console.log(`VU ${__VU}: Connected to ${roomName}`);

      const syncMessage = new Uint8Array([0, 0]);
      socket.sendBinary(syncMessage.buffer);
      messagesSent.add(1);
    });

    socket.on("binaryMessage", (data) => {
      messagesReceived.add(1);
    });

    socket.on("error", (e) => {
      console.log(`VU ${__VU}: Error - ${e.error()}`);
    });

    socket.on("close", () => {
      console.log(`VU ${__VU}: Disconnected from ${roomName}`);
    });

    for (let i = 0; i < 30; i++) {
      const awarenessMessage = new Uint8Array([1, i % 256]);
      socket.sendBinary(awarenessMessage.buffer);
      messagesSent.add(1);
      sleep(1);
    }

    socket.close();
  });

  check(res, {
    "WebSocket connection successful": (r) => r && r.status === 101,
  });
}

export function tldrawTest() {
  const roomId = `tldraw-room-${__VU % 3}`;
  const url = `${BASE_URL}/tldraw/${roomId}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on("open", () => {
      console.log(`VU ${__VU}: Connected to tldraw ${roomId}`);
    });

    socket.on("binaryMessage", (data) => {
      messagesReceived.add(1);
    });

    sleep(20);
    socket.close();
  });

  check(res, {
    "Tldraw WebSocket connected": (r) => r && r.status === 101,
  });
}
