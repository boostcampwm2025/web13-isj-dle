// TODO: 아바타 렌더링을 위해 down만 맞춰놓은 상태이므로, 애니메이션 단계에서 모션에 따른 타일 위치 수정
export const IDLE_BODY_FRAME = {
  down: 27,
  left: 4,
  right: 8,
  up: 4,
} as const;

export const IDLE_HEAD_FRAME = {
  down: 3,
  left: 20,
  right: 24,
  up: 28,
} as const;
