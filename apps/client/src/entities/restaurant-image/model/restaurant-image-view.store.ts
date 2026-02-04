import { create } from "zustand";

export type RestaurantImageViewState = {
  targetUserId: number | null;
  imageUrl: string | null;
  isOpen: boolean;
  isUploadRequested: boolean;

  openViewer: (params: { userId?: number | null; imageUrl: string }) => void;
  closeViewer: () => void;
  requestUpload: (userId: number) => void;
  clearUploadRequest: () => void;
};

export const useRestaurantImageViewStore = create<RestaurantImageViewState>((set) => ({
  targetUserId: null,
  imageUrl: null,
  isOpen: false,
  isUploadRequested: false,

  openViewer: ({ userId, imageUrl }) =>
    set({
      targetUserId: userId ?? null,
      imageUrl: imageUrl,
      isOpen: true,
      isUploadRequested: false,
    }),

  closeViewer: () =>
    set({
      targetUserId: null,
      imageUrl: null,
      isOpen: false,
    }),

  requestUpload: (userId) =>
    set({
      targetUserId: userId,
      imageUrl: null,
      isOpen: false,
      isUploadRequested: true,
    }),

  clearUploadRequest: () =>
    set({
      isUploadRequested: false,
    }),
}));
