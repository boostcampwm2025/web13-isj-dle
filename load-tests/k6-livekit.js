// LiveKit 부하테스트
// 서버 스펙: mi1-g3 (1vCPU, 1GB RAM, 2GB Swap)
// 목적: LiveKit 토큰 발급 API 성능 및 서버 부하 측정
//
// 참고: LiveKit Cloud 자체의 부하테스트는 `lk load-test` CLI 사용 권장
// 이 스크립트는 NestJS 서버의 토큰 발급 API 성능만 테스트

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend, Rate } from "k6/metrics";

// 커스텀 메트릭
const tokenGenerated = new Counter("livekit_tokens_generated");
const tokenGenerationTime = new Trend("livekit_token_generation_time");
const tokenFailRate = new Rate("livekit_token_fail_rate");

export const options = {
  stages: [
    { duration: "10s", target: 5 }, // Warm up
    { duration: "20s", target: 20 }, // Ramp up
    { duration: "20s", target: 50 }, // Peak
    { duration: "15s", target: 0 }, // Cool down
  ],
  thresholds: {
    livekit_token_generation_time: ["p(95)<500"], // 토큰 생성 p95 < 500ms
    livekit_token_fail_rate: ["rate<0.05"], // 실패율 < 5%
    http_req_duration: ["p(95)<1000"], // HTTP 응답 p95 < 1초
  },
  tags: {
    testType: "http",
    target: "livekit-token",
    server: "mi1-g3",
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:3000";

// 테스트용 방 목록 (실제 서비스의 roomId 형식)
const ROOM_IDS = ["seminar-main", "meeting-web-1-10", "meeting-web-11-20", "mogakco-1", "desk-zone-1"];

// 테스트용 사용자 정보 생성
function generateUserInfo() {
  return {
    oddiId: `test-user-${__VU}-${__ITER}-${Date.now()}`,
    nickname: `TestUser${__VU}`,
  };
}

// LiveKit 토큰 발급 테스트
export default function () {
  const roomId = ROOM_IDS[__VU % ROOM_IDS.length];
  const userInfo = generateUserInfo();

  // 1. LiveKit 토큰 발급 API 호출
  const tokenStartTime = Date.now();

  const tokenRes = http.post(
    `${BASE_URL}/api/livekit/token`,
    JSON.stringify({
      roomId: roomId,
      userId: userInfo.oddiId,
      nickname: userInfo.nickname,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
      tags: { name: "livekit_token" },
    },
  );

  const tokenDuration = Date.now() - tokenStartTime;
  tokenGenerationTime.add(tokenDuration);

  const tokenSuccess = check(tokenRes, {
    "token API returns 200 or 201": (r) => r.status === 200 || r.status === 201,
    "token response has token": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token && body.token.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  if (tokenSuccess) {
    tokenGenerated.add(1);
  } else {
    tokenFailRate.add(1);
    console.log(`VU ${__VU}: Token generation failed - ${tokenRes.status}: ${tokenRes.body}`);
  }

  // 2. 토큰 발급 후 잠시 대기 (실제 사용자 행동 시뮬레이션)
  sleep(Math.random() * 2 + 1); // 1-3초 랜덤 대기
}

// 동시 입장 스트레스 테스트
// 세미나 시작 시 200명이 동시에 입장하는 상황 시뮬레이션
// k6 run --env SCENARIO=burst k6-livekit.js
export function burstTokenTest() {
  const roomId = "seminar-main"; // 모든 사용자가 같은 방에 입장
  const userInfo = generateUserInfo();

  const tokenRes = http.post(
    `${BASE_URL}/api/livekit/token`,
    JSON.stringify({
      roomId: roomId,
      userId: userInfo.oddiId,
      nickname: userInfo.nickname,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  check(tokenRes, {
    "burst token success": (r) => r.status === 200 || r.status === 201,
  });
}

// LiveKit Room 정보 조회 테스트 (관리자 기능)
export function roomInfoTest() {
  const roomId = ROOM_IDS[__VU % ROOM_IDS.length];

  const res = http.get(`${BASE_URL}/api/livekit/room/${roomId}`, {
    tags: { name: "livekit_room_info" },
  });

  check(res, {
    "room info returns 200": (r) => r.status === 200,
  });

  sleep(1);
}

// LiveKit 참가자 목록 조회 테스트
export function participantsTest() {
  const roomId = ROOM_IDS[__VU % ROOM_IDS.length];

  const res = http.get(`${BASE_URL}/api/livekit/room/${roomId}/participants`, {
    tags: { name: "livekit_participants" },
  });

  check(res, {
    "participants returns 200": (r) => r.status === 200,
  });

  sleep(1);
}
