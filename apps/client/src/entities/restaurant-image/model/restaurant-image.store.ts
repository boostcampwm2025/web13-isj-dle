import { create } from "zustand";

type RestaurantImageState = {
  thumbnailUrlByUserId: Record<number, string | null>;

  setThumbnail: (userId: number, url: string) => void;
  clearThumbnail: (userId: number) => void;
  hasThumbnail: (userId: number) => boolean;
  getThumbnailUrlByUserId: (userId: number) => string | null;
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
