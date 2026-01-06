import { AVATAR_ASSETS } from "@shared/types";

import { generateRandomAvatar } from "./avatar.generator";

describe("generateRandomAvatar", () => {
  test("유효한 아바타 키를 반환해야 함", () => {
    const avatar = generateRandomAvatar();
    const validKeys = ["ADAM", "ALEX", "AMELIA", "BOB"];

    expect(validKeys).toContain(avatar);
  });

  test("반환값이 AvatarAssetKey 타입이어야 함", () => {
    const avatar = generateRandomAvatar();

    expect(typeof avatar).toBe("string");
    expect(avatar).toMatch(/^[A-Z]+$/); // 대문자로만 구성
  });

  test("여러 번 호출 시 모든 아바타가 선택될 수 있어야 함", () => {
    const results = new Set<string>();
    const iterations = 100;

    // 100번 실행하여 다양한 아바타가 나오는지 확인
    for (let i = 0; i < iterations; i++) {
      results.add(generateRandomAvatar());
    }

    // 최소 2개 이상의 다른 아바타가 나와야 함 (랜덤성 검증)
    expect(results.size).toBeGreaterThanOrEqual(2);
  });

  test("반환된 아바타 키로 AVATAR_ASSETS 접근 가능해야 함", () => {
    const avatar = generateRandomAvatar();

    expect(AVATAR_ASSETS[avatar]).toBeDefined();
    expect(AVATAR_ASSETS[avatar].url).toMatch(/^\/assets\/avatars\/.+\.png$/);
  });
});
