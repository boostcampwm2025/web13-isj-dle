import { create } from "zustand";

export type RestaurantImage = {
  id: string;
  userId: string;
  url: string;
};

type RestaurantImageEntityState = {
  imagesById: Record<string, RestaurantImage>;
  latestImageIdByUserId: Record<string, string | null>;

  setUserThumbnail: (userId: string, url: string) => void;
  hasThumbnail: (userId: string) => boolean;
  getThumbnailUrlByUserId: (userId: string) => string | null;
};

export const useRestaurantImageEntityStore = create<RestaurantImageEntityState>((set, get) => ({
  imagesById: {},
  latestImageIdByUserId: {},

  setUserThumbnail: (userId, url) =>
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

  hasThumbnail: (userId) => {
    return Boolean(get().getThumbnailUrlByUserId(userId));
  },

  getThumbnailUrlByUserId: (userId) => {
    const imageId = get().latestImageIdByUserId[userId];
    if (!imageId) return null;
    return get().imagesById[imageId]?.url ?? null;
  },
}));
