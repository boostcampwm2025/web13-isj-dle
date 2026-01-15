import { AVATAR_ASSETS, type AvatarAssetKey } from "@shared/types";

const AVATAR_KEYS = Object.keys(AVATAR_ASSETS) as AvatarAssetKey[];

export const generateRandomAvatar = (): AvatarAssetKey => {
  const randomIndex = Math.floor(Math.random() * AVATAR_KEYS.length);
  return AVATAR_KEYS[randomIndex];
};
