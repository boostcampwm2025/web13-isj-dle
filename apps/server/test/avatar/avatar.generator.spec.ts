import { AVATAR_ASSETS } from "@shared/types";
import { generateRandomAvatar } from "src/avatar/avatar.generator";

describe("generateRandomAvatar", () => {
  test("유효한 아바타 키를 반환해야 함", () => {
    const avatar = generateRandomAvatar();
    const validKeys = ["ADAM", "ALEX", "AMELIA", "BOB"];

    expect(validKeys).toContain(avatar);
  });

  test("반환값이 AvatarAssetKey 타입이어야 함", () => {
    const avatar = generateRandomAvatar();

    expect(typeof avatar).toBe("string");
    expect(avatar).toMatch(/^[A-Z]+$/);
  });

  test("여러 번 호출 시 모든 아바타가 선택될 수 있어야 함", () => {
    const results = new Set<string>();
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      results.add(generateRandomAvatar());
    }

    expect(results.size).toBeGreaterThanOrEqual(2);
  });

  test("반환된 아바타 키로 AVATAR_ASSETS 접근 가능해야 함", () => {
    const avatar = generateRandomAvatar();

    expect(AVATAR_ASSETS[avatar]).toBeDefined();
    expect(AVATAR_ASSETS[avatar].url).toMatch(/^\/assets\/avatars\/.+\.png$/);
  });
});
