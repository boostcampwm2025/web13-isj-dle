import ImageList from "./ImageList";
import ImageUploadButton from "./ImageUploadButton";
import ImageViewerModal from "./ImageViewerModal";

import { useCallback, useRef } from "react";

import {
  getRestaurantImageKeyFromUrl,
  restaurantImageKeys,
  useRestaurantImageStore,
  useRestaurantImagesFeedQuery,
} from "@entities/restaurant-image";
import { useUserStore } from "@entities/user";
import type { RestaurantImage, RestaurantImageFeedResponse } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";

const RestaurantSidebar = () => {
  const userId = useUserStore((state) => state.user?.id ?? null);
  const nickname = useUserStore((state) => state.user?.nickname ?? "");
  const setUserThumbnail = useRestaurantImageStore((state) => state.setThumbnail);
  const clearUserThumbnail = useRestaurantImageStore((state) => state.clearThumbnail);

  const uploadStateRef = useRef<Map<string, { tempId: string; prevThumbnailUrl: string | null }>>(new Map());
  const queryClient = useQueryClient();

  const imagesFeedQuery = useRestaurantImagesFeedQuery(userId);
  const images = imagesFeedQuery.data?.images ?? [];

  const handleOptimisticPreview = useCallback(
    ({ previewUrl, uploadId }: { previewUrl: string; uploadId: string }) => {
      if (!userId) return;
      const tempId = crypto.randomUUID();
      const prevThumbnailUrl = useRestaurantImageStore.getState().getThumbnailUrlByUserId(userId);
      uploadStateRef.current.set(uploadId, { tempId, prevThumbnailUrl });

      setUserThumbnail(userId, previewUrl);

      const newImage: RestaurantImage = {
        id: tempId,
        url: previewUrl,
        userId,
        nickname,
        likes: 0,
        likedByMe: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<RestaurantImageFeedResponse>(restaurantImageKeys.feed(), (prev) => {
        const prevImages = prev?.images ?? [];
        return { images: [newImage, ...prevImages] };
      });
    },
    [userId, nickname, setUserThumbnail, queryClient],
  );

  const handleUploadComplete = useCallback(
    ({ serverUrl, uploadId }: { serverUrl: string; uploadId: string }) => {
      const state = uploadStateRef.current.get(uploadId);
      if (!state || !userId) return;
      uploadStateRef.current.delete(uploadId);

      queryClient.setQueryData<RestaurantImageFeedResponse>(restaurantImageKeys.feed(), (prev) => {
        const prevImages = prev?.images ?? [];
        const nextImages = prevImages.map((img) => (img.id === state.tempId ? { ...img, url: serverUrl } : img));
        return { images: nextImages };
      });

      setUserThumbnail(userId, serverUrl);
    },
    [userId, setUserThumbnail, queryClient],
  );

  const handleUploadError = useCallback(
    async (uploadId: string) => {
      const state = uploadStateRef.current.get(uploadId);
      if (!state || !userId) return;
      uploadStateRef.current.delete(uploadId);

      queryClient.setQueryData<RestaurantImageFeedResponse>(restaurantImageKeys.feed(), (prev) => {
        const prevImages = prev?.images ?? [];
        const nextImages = prevImages.filter((img) => img.id !== state.tempId);
        return { images: nextImages };
      });

      if (state.prevThumbnailUrl) setUserThumbnail(userId, state.prevThumbnailUrl);
      else clearUserThumbnail(userId);

      await queryClient.invalidateQueries({ queryKey: restaurantImageKeys.feed() }).catch(() => undefined);
    },
    [userId, setUserThumbnail, clearUserThumbnail, queryClient],
  );

  const handleDeleteImage = useCallback(
    (deletedUrl: string) => {
      const deletedKey = getRestaurantImageKeyFromUrl(deletedUrl);
      queryClient.setQueryData<RestaurantImageFeedResponse>(restaurantImageKeys.feed(), (prev) => {
        const prevImages = prev?.images ?? [];
        const nextImages = prevImages.filter((img) => {
          if (deletedKey) return getRestaurantImageKeyFromUrl(img.url) !== deletedKey;
          return img.url !== deletedUrl;
        });
        return { images: nextImages };
      });
    },
    [queryClient],
  );

  const handleUpdateImage = useCallback(
    (oldUrl: string, newUrl: string) => {
      const oldKey = getRestaurantImageKeyFromUrl(oldUrl);
      queryClient.setQueryData<RestaurantImageFeedResponse>(restaurantImageKeys.feed(), (prev) => {
        const prevImages = prev?.images ?? [];
        const nextImages = prevImages.map((img) => {
          const same = oldKey ? getRestaurantImageKeyFromUrl(img.url) === oldKey : img.url === oldUrl;
          return same ? { ...img, url: newUrl } : img;
        });
        return { images: nextImages };
      });
    },
    [queryClient],
  );

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <ImageUploadButton
        onOptimisticPreview={handleOptimisticPreview}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />

      <ImageList images={images} />
      <ImageViewerModal onDelete={handleDeleteImage} onUpdate={handleUpdateImage} />
    </div>
  );
};

export default RestaurantSidebar;
