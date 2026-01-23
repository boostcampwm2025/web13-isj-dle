import { create } from "zustand";

export type RestaurantImagePreviewState = {
  targetUserId: string | null;
  imageUrl: string | null;
  isOpen: boolean;
  isUploadRequested: boolean;

  openPreview: (params: { userId?: string | null; imageUrl: string }) => void;
  closePreview: () => void;
  requestUpload: (userId: string) => void;
  clearUploadRequest: () => void;
};

export const useRestaurantImagePreviewStore = create<RestaurantImagePreviewState>((set) => ({
  targetUserId: null,
  imageUrl: null,
  isOpen: false,
  isUploadRequested: false,

  openPreview: ({ userId, imageUrl }) =>
    set({
      targetUserId: userId ?? null,
      imageUrl,
      isOpen: true,
      isUploadRequested: false,
    }),

  closePreview: () =>
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
