import { memo, useCallback } from "react";

import { useRestaurantImageViewStore } from "@entities/restaurant-image";
import type { RestaurantImage } from "@shared/types";

type ImageListProps = {
  images: RestaurantImage[];
};

const ImageList = memo(({ images }: ImageListProps) => {
  const openViewerModal = useRestaurantImageViewStore((state) => state.openViewer);

  const handleImageClick = useCallback(
    (params: { userId: string; url: string }) => {
      openViewerModal({ userId: params.userId, imageUrl: params.url });
    },
    [openViewerModal],
  );

  if (images.length === 0) {
    return <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">아직 등록한 음식 사진이 없어요.</div>;
  }

  return (
    <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      <p className="font-semibold">오늘의 먹로그</p>
      <div className="grid grid-cols-2 gap-2">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => handleImageClick({ userId: image.userId, url: image.url })}
            className="text-left"
          >
            <img src={image.url} alt="음식 사진" className="h-24 w-full rounded-sm object-cover" />
            <p className="mt-1 truncate text-xs text-gray-600">{image.nickname}</p>
          </button>
        ))}
      </div>
    </div>
  );
});

export default ImageList;
