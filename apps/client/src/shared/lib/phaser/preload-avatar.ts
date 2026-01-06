import { AVATAR_ASSETS } from "@shared/types";

const AVATAR_FRAME_SIZE = 16;

type SpriteSheetLoader = {
  load: {
    spritesheet: (
      key: string,
      url: string,
      config: {
        frameWidth: number;
        frameHeight: number;
      },
    ) => void;
  };
};

export const preloadAvatar = (loader: SpriteSheetLoader) => {
  Object.entries(AVATAR_ASSETS).forEach(([avatarKey, { url }]) => {
    loader.load.spritesheet(avatarKey, url, {
      frameWidth: AVATAR_FRAME_SIZE,
      frameHeight: AVATAR_FRAME_SIZE,
    });
  });
};
