# 소켓 최적화 Before 수치

> 측정 시점: 메트릭 추가 완료, 최적화 커밋 적용 전
> 서버 접속 유저 수: 2명

---

## USER_SYNC 페이로드 크기

```
USER_ID=1 node tests/load/measure-user-sync.mjs
```

| 항목 | 측정값 |
|------|--------|
| 초기 접속 USER_SYNC 페이로드 크기 | 727 bytes |
| room:join USER_SYNC 페이로드 크기 | 727 bytes |
| users[] 포함 여부 | true |
| users 수 | 2명 |

> 유저 수 N이 늘어날수록 페이로드 크기는 선형 증가.
> 유저 1명당 약 300~350 bytes 추가.

---

## ROOM_JOINED 수신 범위

```
USER_A=1 USER_B=2 USER_C=3 node tests/load/measure-room-joined.mjs
```

| 항목 | 측정값 |
|------|--------|
| 다른 방 유저(B)의 room:joined 수신 횟수 | 1회 |
| 결과 | Before: 전역 브로드캐스트 확인됨 |
