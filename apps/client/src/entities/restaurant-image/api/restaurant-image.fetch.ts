import type { RestaurantImageFeedResponse, RestaurantImageResponse } from "@shared/types";

export const fetchMyRestaurantImage = async (userId: string): Promise<RestaurantImageResponse> => {
  const res = await fetch("/api/restaurant/images/me", {
    headers: {
      "x-user-id": userId,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch images");
  }
  return res.json();
};

export const fetchUserRestaurantImage = async (
  requestUserId: string,
  targetUserId: string,
): Promise<RestaurantImageResponse> => {
  const res = await fetch(`/api/restaurant/images/user/${encodeURIComponent(targetUserId)}`, {
    headers: {
      "x-user-id": requestUserId,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch images");
  }
  return res.json();
};

export const fetchRestaurantImagesFeed = async (requestUserId: string): Promise<RestaurantImageFeedResponse> => {
  const res = await fetch("/api/restaurant/images/feed", {
    headers: {
      "x-user-id": requestUserId,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch images");
  }
  return res.json();
};
