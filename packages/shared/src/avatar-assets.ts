export const AVATAR_ASSETS = {
  ADAM: {
    url: "/assets/avatars/Adam_16x16.png",
  },
  ALEX: {
    url: "/assets/avatars/Alex_16x16.png",
  },
  AMELIA: {
    url: "/assets/avatars/Amelia_16x16.png",
  },
  BOB: {
    url: "/assets/avatars/Bob_16x16.png",
  },
} as const;

export type AvatarAssetKey = keyof typeof AVATAR_ASSETS;
