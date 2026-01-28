import type { RestaurantImage, RestaurantImageFeedResponse, RestaurantImageResponse } from "@shared/types";

const mapImages = (images: RestaurantImage[], updater: (img: RestaurantImage) => RestaurantImage) => {
  let changed = false;
  const next = images.map((img) => {
    const updated = updater(img);
    if (updated !== img) changed = true;
    return updated;
  });
  return changed ? next : images;
};

export const updateRestaurantImagesCache = (
  data: unknown,
  updater: (img: RestaurantImage) => RestaurantImage,
): unknown => {
  if (!data || typeof data !== "object") return data;

  if ("images" in data && Array.isArray((data as { images: unknown }).images)) {
    const typed = data as RestaurantImageFeedResponse | RestaurantImageResponse;
    const nextImages = mapImages(typed.images, updater);

    if ("latestImage" in typed) {
      const nextLatest =
        typed.latestImage && typeof typed.latestImage === "object" ? updater(typed.latestImage) : typed.latestImage;
      if (nextImages === typed.images && nextLatest === typed.latestImage) return data;
      return { ...typed, images: nextImages, latestImage: nextLatest } satisfies RestaurantImageResponse;
    }

    if (nextImages === typed.images) return data;
    return { ...typed, images: nextImages } satisfies RestaurantImageFeedResponse;
  }

  return data;
};
