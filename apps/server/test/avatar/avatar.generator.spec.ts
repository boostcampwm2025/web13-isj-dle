import { AVATAR_ASSETS, type AvatarAssetKey } from "@shared/types";

import { generateRandomAvatar } from "../../src/avatar/avatar.generator";

describe("AvatarGenerator", () => {
  const AVATAR_KEYS = Object.keys(AVATAR_ASSETS) as AvatarAssetKey[];

  describe("generateRandomAvatar", () => {
    it("유효한 아바타 키를 반환해야 함", () => {
      const result = generateRandomAvatar();

      expect(AVATAR_KEYS).toContain(result);
    });

    it("여러 번 호출 시 다른 아바타를 반환해야 함 (랜덤성 테스트)", () => {
      const results = new Set<AvatarAssetKey>();

      // 100번 호출하여 최소 2개 이상의 다른 결과가 나오는지 확인
      for (let i = 0; i < 100; i++) {
        results.add(generateRandomAvatar());
      }

      // 아바타 종류가 1개보다 많다면 랜덤성 확인
      if (AVATAR_KEYS.length > 1) {
        expect(results.size).toBeGreaterThan(1);
      }
    });

    it("AVATAR_ASSETS에 존재하는 키만 반환해야 함", () => {
      for (let i = 0; i < 50; i++) {
        const result = generateRandomAvatar();
        expect(AVATAR_ASSETS[result]).toBeDefined();
      }
    });
  });
});
