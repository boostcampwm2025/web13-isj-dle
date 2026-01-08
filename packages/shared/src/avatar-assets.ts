export const AVATAR_ASSETS = {
  ADAM: {
    url: "/assets/avatars/Adam.png",
  },
  ALEX: {
    url: "/assets/avatars/Alex.png",
  },
  AMELIA: {
    url: "/assets/avatars/Amelia.png",
  },
  BOB: {
    url: "/assets/avatars/Bob.png",
  },
} as const;

export type AvatarAssetKey = keyof typeof AVATAR_ASSETS;
