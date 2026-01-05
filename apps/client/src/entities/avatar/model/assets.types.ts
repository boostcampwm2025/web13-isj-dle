export const AVATAR_ASSETS = {
  ADAM: {
    key: "avatar-adam",
    url: "/assets/avatars/Adam_16x16.png",
  },
  ALEX: {
    key: "avatar-alex",
    url: "/assets/avatars/Alex_16x16.png",
  },
  AMELIA: {
    key: "avatar-amelia",
    url: "/assets/avatars/Amelia_16x16.png",
  },
  BOB: {
    key: "avatar-bob",
    url: "/assets/avatars/Bob_16x16.png",
  },
} as const;

export type AvatarAssetKey = keyof typeof AVATAR_ASSETS;
