export const AVATAR_ASSETS = {
  ADAM: {
    url: "/assets/avatars/Adam.webp",
    profileUrl: "/assets/avatars/Adam_profile.webp",
  },
  ALEX: {
    url: "/assets/avatars/Alex.webp",
    profileUrl: "/assets/avatars/Alex_profile.webp",
  },
  AMELIA: {
    url: "/assets/avatars/Amelia.webp",
    profileUrl: "/assets/avatars/Amelia_profile.webp",
  },
  BOB: {
    url: "/assets/avatars/Bob.webp",
    profileUrl: "/assets/avatars/Bob_profile.webp",
  },
} as const;

export type AvatarAssetKey = keyof typeof AVATAR_ASSETS;
