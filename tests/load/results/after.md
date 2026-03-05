# 소켓 최적화 After 수치

> 측정 시점: ROOM_JOINED 방 단위 수정 + USER_SYNC users[] 제거 적용 후
> 서버 접속 유저 수: 1명

---

## USER_SYNC 페이로드 크기

```
USER_ID=1 node tests/load/measure-user-sync.mjs
```

| 항목 | 측정값 |
|------|--------|
| 초기 접속 USER_SYNC 페이로드 크기 | 492 bytes |
| room:join USER_SYNC 페이로드 크기 | **245 bytes** |
| users[] 포함 여부 | false |
| users 수 | 0명 (필드 없음) |

---

## ROOM_JOINED 수신 범위

```
USER_A=1 USER_B=2 USER_C=3 node tests/load/measure-room-joined.mjs
```

| 항목 | 측정값 |
|------|--------|
| 다른 방 유저(B)의 room:joined 수신 횟수 | **0회** |
| 결과 | After: 방 단위 emit 확인됨 |

---

## Before/After 비교

### USER_SYNC 페이로드 크기

| 유저 수 | Before | After | 절감 |
|---------|--------|-------|------|
| 실측 (2명) | 727 bytes | 245 bytes | 66% ↓ |
| 추산 (10명) | ~2,650 bytes | 245 bytes | ~91% ↓ |
| 추산 (30명) | ~7,475 bytes | 245 bytes | ~97% ↓ |

> 유저 1명당 약 241 bytes 추가 (before.md 실측 기준).
> After는 접속 유저 수와 무관하게 245 bytes 고정.

### ROOM_JOINED 수신 범위

| 항목 | Before | After |
|------|--------|-------|
| 다른 방 유저의 수신 횟수 | 1회 (전역) | 0회 (방 단위) |
| 불필요한 수신자 | 전체 유저 - 방 인원 | 없음 |
