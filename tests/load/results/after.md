# 소켓 최적화 After 수치

> 측정 시점: 최적화 커밋 적용 후
> 서버 상태: 접속 유저 수 __명 (Before와 동일 조건)

---

## USER_SYNC 페이로드 크기

```
k6 run tests/load/measure-user-sync.js -e USER_ID=<id>
```

| 항목 | 측정값 |
|------|--------|
| 페이로드 크기 (bytes) | |
| users[] 포함 여부 | false |
| users 수 | 0명 (필드 없음) |

---

## ROOM_JOINED 수신 범위

```
node tests/load/measure-room-joined.mjs
```

| 항목 | 측정값 |
|------|--------|
| 다른 방 유저(B)의 room:joined 수신 횟수 | 0회 |
| 결과 | After: 방 단위 emit |

---

## Before/After 비교

| 항목 | Before | After | 개선율 |
|------|--------|-------|--------|
| USER_SYNC 페이로드 크기 | B | B | % |
| ROOM_JOINED 불필요 수신 | 1회 | 0회 | 100% |
