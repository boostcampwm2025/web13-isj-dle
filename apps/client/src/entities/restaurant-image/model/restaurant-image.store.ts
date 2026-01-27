import { create } from "zustand";

type RestaurantImageState = {
  latestImageIdByUserId: Record<string, string | null>;
  imageUrlsById: Record<string, string>;

  setThumbnail: (userId: string, url: string) => void;
  clearThumbnail: (userId: string) => void;
  hasThumbnail: (userId: string) => boolean;
  getThumbnailUrlByUserId: (userId: string) => string | null;
};

export const useRestaurantImageStore = create<RestaurantImageState>((set, get) => ({
  latestImageIdByUserId: {},
  imageUrlsById: {},

  setThumbnail: (userId, url) =>
    set((state) => ({
      imageUrlsById: {
        ...state.imageUrlsById,
        [url]: url,
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
    return get().imageUrlsById[imageId] ?? null;
  },
}));
