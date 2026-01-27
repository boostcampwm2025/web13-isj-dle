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

export type PresignRestaurantImageResponse = {
  key: string;
  uploadUrl: string;
  imageUrl: string;
  viewUrl?: string;
};

export const presignRestaurantImageUpload = async (
  userId: string,
  params: { contentType: string; originalName?: string },
): Promise<PresignRestaurantImageResponse> => {
  const res = await fetch("/api/restaurant/images/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error("Presign failed");
  }

  return res.json();
};

export const putPresignedRestaurantImage = async (uploadUrl: string, file: File): Promise<void> => {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error("Presigned upload failed");
  }
};

export const replaceRestaurantImage = async (
  userId: string,
  imageUrl: string,
  newImageUrl: string,
): Promise<string> => {
  const res = await fetch("/api/restaurant/images", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify({ imageUrl, newImageUrl }),
  });

  if (!res.ok) {
    throw new Error("Update failed");
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
