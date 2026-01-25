import { memo, useCallback } from "react";

import { useRestaurantImageViewStore } from "@entities/restaurant-image";
import type { RestaurantImage } from "@shared/types";

type ImageListProps = {
  images: RestaurantImage[];
  userId: string | null;
};

const ImageList = memo(({ images, userId }: ImageListProps) => {
  const openViewerModal = useRestaurantImageViewStore((state) => state.openViewer);

  const handleImageClick = useCallback(
    (url: string) => {
      openViewerModal({ userId, imageUrl: url });
    },
    [openViewerModal, userId],
  );

  if (images.length === 0) {
    return <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">아직 등록한 음식 사진이 없어요.</div>;
  }

  return (
    <>
      <p className="font-semibold">오늘 먹은 음식</p>
      <div className="grid grid-cols-2 gap-2">
        {images.map((image) => (
          <button key={image.id} type="button" onClick={() => handleImageClick(image.url)} className="text-left">
            <img src={image.url} alt="음식 사진" className="h-24 w-full rounded-sm object-cover" />
            <p className="mt-1 truncate text-xs text-gray-600">{image.nickname}</p>
          </button>
        ))}
      </div>
    </>
  );
});

export default ImageList;
