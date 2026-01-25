import { create } from "zustand";

import type { RestaurantImage } from "@shared/types";

type RestaurantImageState = {
  imagesById: Record<string, Omit<RestaurantImage, "nickname" | "createdAt">>;
  latestImageIdByUserId: Record<string, string | null>;

  setThumbnail: (userId: string, url: string) => void;
  clearThumbnail: (userId: string) => void;
  hasThumbnail: (userId: string) => boolean;
  getThumbnailUrlByUserId: (userId: string) => string | null;
};

export const useRestaurantImageStore = create<RestaurantImageState>((set, get) => ({
  imagesById: {},
  latestImageIdByUserId: {},

  setThumbnail: (userId, url) =>
    set((state) => ({
      imagesById: {
        ...state.imagesById,
        [url]: { id: url, userId, url },
      },
      latestImageIdByUserId: {
        ...state.latestImageIdByUserId,
        [userId]: url,
      },
    })),

  clearThumbnail: (userId) =>
    set((state) => ({
      latestImageIdByUserId: {
        ...state.latestImageIdByUserId,
        [userId]: null,
      },
    })),

  hasThumbnail: (userId) => {
    return Boolean(get().getThumbnailUrlByUserId(userId));
  },

  getThumbnailUrlByUserId: (userId) => {
    const imageId = get().latestImageIdByUserId[userId];
    if (!imageId) return null;
    return get().imagesById[imageId]?.url ?? null;
  },
}));
