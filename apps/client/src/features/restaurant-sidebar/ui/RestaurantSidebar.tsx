import ImageList from "./ImageList";
import ImageUploadButton from "./ImageUploadButton";
import ImageViewerModal from "./ImageViewerModal";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchMyRestaurantImage, useRestaurantImageStore } from "@entities/restaurant-image";
import { useUserStore } from "@entities/user";
import type { RestaurantImage } from "@shared/types";

const RestaurantSidebar = () => {
  const userId = useUserStore((state) => state.user?.id ?? null);
  const nickname = useUserStore((state) => state.user?.nickname ?? "");
  const setUserThumbnail = useRestaurantImageStore((state) => state.setThumbnail);
  const clearUserThumbnail = useRestaurantImageStore((state) => state.clearThumbnail);

  const [images, setImages] = useState<RestaurantImage[]>([]);
  const pendingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadImages = async () => {
      const data = await fetchMyRestaurantImage(userId);
      setImages(data.images);
      if (data.latestImage) {
        setUserThumbnail(userId, data.latestImage.url);
      } else {
        clearUserThumbnail(userId);
      }
    };

    loadImages();
  }, [userId, setUserThumbnail, clearUserThumbnail]);

  const reloadImages = useCallback(async () => {
    if (!userId) return;
    const data = await fetchMyRestaurantImage(userId);
    setImages(data.images);
    if (data.latestImage) {
      setUserThumbnail(userId, data.latestImage.url);
    } else {
      clearUserThumbnail(userId);
    }
  }, [userId, setUserThumbnail, clearUserThumbnail]);

  const handleOptimisticPreview = useCallback(
    (previewUrl: string) => {
      const tempId = crypto.randomUUID();
      pendingIdRef.current = tempId;

      if (userId) {
        setUserThumbnail(userId, previewUrl);
      }
      const newImage: RestaurantImage = {
        id: tempId,
        url: previewUrl,
        userId: userId ?? "",
        nickname,
        createdAt: new Date().toISOString(),
      };
      setImages((prev) => [newImage, ...prev]);
    },
    [userId, nickname, setUserThumbnail],
  );

  const handleUploadComplete = useCallback(
    (serverUrl: string) => {
      const tempId = pendingIdRef.current;
      pendingIdRef.current = null;

      setImages((prev) => prev.map((img) => (img.id === tempId ? { ...img, url: serverUrl } : img)));
      if (userId) {
        setUserThumbnail(userId, serverUrl);
      }
    },
    [userId, setUserThumbnail],
  );

  const handleDeleteImage = useCallback(
    (deletedUrl: string) => {
      setImages((prev) => {
        const filtered = prev.filter((img) => img.url !== deletedUrl);
        if (userId) {
          if (filtered.length > 0) {
            setUserThumbnail(userId, filtered[0].url);
          } else {
            clearUserThumbnail(userId);
          }
        }
        return filtered;
      });
    },
    [userId, setUserThumbnail, clearUserThumbnail],
  );

  const handleUpdateImage = useCallback(
    (oldUrl: string, newUrl: string) => {
      setImages((prev) => prev.map((img) => (img.url === oldUrl ? { ...img, url: newUrl } : img)));
      if (userId) {
        setUserThumbnail(userId, newUrl);
      }
    },
    [userId, setUserThumbnail],
  );

  return (
    <div className="scrollbar-hide flex h-full w-full flex-col gap-4 overflow-y-auto">
      <ImageUploadButton
        onOptimisticPreview={handleOptimisticPreview}
        onUploadComplete={handleUploadComplete}
        onUploadError={reloadImages}
      />

      <ImageList images={images} userId={userId} />
      <ImageViewerModal onDelete={handleDeleteImage} onUpdate={handleUpdateImage} />
    </div>
  );
};

export default RestaurantSidebar;
