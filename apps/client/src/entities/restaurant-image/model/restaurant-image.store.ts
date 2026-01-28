import { create } from "zustand";

type RestaurantImageState = {
  thumbnailUrlByUserId: Record<string, string | null>;

  setThumbnail: (userId: string, url: string) => void;
  clearThumbnail: (userId: string) => void;
  hasThumbnail: (userId: string) => boolean;
  getThumbnailUrlByUserId: (userId: string) => string | null;
};

export const useRestaurantImageStore = create<RestaurantImageState>((set, get) => ({
  thumbnailUrlByUserId: {},

  setThumbnail: (userId, url) =>
    set((state) => ({
      thumbnailUrlByUserId: {
        ...state.thumbnailUrlByUserId,
        [userId]: url,
      },
    })),

  clearThumbnail: (userId) =>
    set((state) => ({
      thumbnailUrlByUserId: {
        ...state.thumbnailUrlByUserId,
        [userId]: null,
      },
    })),

  hasThumbnail: (userId) => {
    return Boolean(get().getThumbnailUrlByUserId(userId));
  },

  getThumbnailUrlByUserId: (userId) => {
    return get().thumbnailUrlByUserId[userId] ?? null;
  },
}));
