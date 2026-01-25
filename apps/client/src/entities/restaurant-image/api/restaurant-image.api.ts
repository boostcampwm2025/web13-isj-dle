import type { RestaurantImageResponse } from "@shared/types";

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

export const uploadRestaurantImage = async (userId: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/restaurant/images", {
    method: "POST",
    headers: {
      "x-user-id": userId,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.imageUrl;
};

export const deleteRestaurantImage = async (userId: string, imageUrl: string): Promise<void> => {
  const res = await fetch("/api/restaurant/images", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify({ imageUrl }),
  });

  if (!res.ok) {
    throw new Error("Delete failed");
  }
};
