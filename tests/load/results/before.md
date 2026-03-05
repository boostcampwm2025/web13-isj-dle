# 소켓 최적화 Before 수치

> 측정 시점: 최적화 커밋 적용 전 (메트릭 추가만 완료된 상태)
> 서버 상태: 접속 유저 수 __명

---

## USER_SYNC 페이로드 크기

```
k6 run tests/load/measure-user-sync.js -e USER_ID=<id>
```

| 항목 | 측정값 |
|------|--------|
| 페이로드 크기 (bytes) | |
| users[] 포함 여부 | true |
| users 수 | 명 |

---

## ROOM_JOINED 수신 범위

```
node tests/load/measure-room-joined.mjs
```

| 항목 | 측정값 |
|------|--------|
| 다른 방 유저(B)의 room:joined 수신 횟수 | 회 |
| 결과 | Before: 전역 브로드캐스트 |
