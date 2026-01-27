import { Heart } from "lucide-react";

import { memo, useCallback } from "react";

import { useRestaurantImageViewStore, useToggleRestaurantImageLikeMutation } from "@entities/restaurant-image";
import { useUserStore } from "@entities/user";
import type { RestaurantImage } from "@shared/types";

const SkeletonImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => (
  <div className={`${className} rounded-sm bg-gray-200`}>
    <img src={src} alt={alt} className="h-full w-full rounded-sm object-cover" />
  </div>
);

type ImageListProps = {
  images: RestaurantImage[];
  isLoading?: boolean;
};

const ImageListSkeleton = () => (
  <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
    <p className="font-semibold">오늘의 먹로그</p>
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="h-24 w-full rounded-sm bg-gray-200" />
          <div className="mt-1 h-3 w-16 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  </div>
);

const ImageList = memo(({ images, isLoading }: ImageListProps) => {
  const openViewerModal = useRestaurantImageViewStore((state) => state.openViewer);
  const userId = useUserStore((state) => state.user?.id ?? null);
  const toggleLikeMutation = useToggleRestaurantImageLikeMutation(userId);

  const handleImageClick = useCallback(
    (params: { userId: string; url: string }) => {
      openViewerModal({ userId: params.userId, imageUrl: params.url });
    },
    [openViewerModal],
  );

  const handleLikeClick = useCallback(
    (e: React.MouseEvent, imageId: string) => {
      e.stopPropagation();
      if (!userId) return;
      if (!/^\d+$/.test(imageId)) return;
      toggleLikeMutation.mutate(imageId);
    },
    [toggleLikeMutation, userId],
  );

  if (isLoading) {
    return <ImageListSkeleton />;
  }

  if (images.length === 0) {
    return <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">아직 등록된 음식 사진이 없어요</div>;
  }

  return (
    <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      <p className="font-semibold">오늘의 먹로그</p>
      <div className="grid grid-cols-2 gap-2">
        {images.map((image) => (
          <div key={image.id} className="relative">
            <button
              type="button"
              onClick={() => handleImageClick({ userId: image.userId, url: image.url })}
              className="w-full text-left"
            >
              <SkeletonImage src={image.url} alt="음식 사진" className="h-24 w-full" />
              <p className="mt-1 truncate text-xs text-gray-600">{image.nickname}</p>
            </button>
            <button
              type="button"
              onClick={(e) => handleLikeClick(e, image.id)}
              className="absolute right-1 bottom-7 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-white transition-colors hover:bg-black/70"
              aria-pressed={image.likedByMe}
            >
              <Heart className="h-3 w-3" fill={image.likedByMe ? "currentColor" : "none"} />
              <span className="text-xs">{image.likes}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ImageList;
