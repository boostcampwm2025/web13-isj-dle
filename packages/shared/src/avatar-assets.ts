export const AVATAR_ASSETS = {
  ADAM: {
    url: "/assets/avatars/Adam.png",
    profileUrl: "/assets/avatars/Adam_profile.png",
  },
  ALEX: {
    url: "/assets/avatars/Alex.png",
    profileUrl: "/assets/avatars/Alex_profile.png",
  },
  AMELIA: {
    url: "/assets/avatars/Amelia.png",
    profileUrl: "/assets/avatars/Amelia_profile.png",
  },
  BOB: {
    url: "/assets/avatars/Bob.png",
    profileUrl: "/assets/avatars/Bob_profile.png",
  },
} as const;

export type AvatarAssetKey = keyof typeof AVATAR_ASSETS;
