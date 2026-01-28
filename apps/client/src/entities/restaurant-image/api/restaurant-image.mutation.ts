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

export type ToggleRestaurantImageLikeResponse = {
  likes: number;
  liked: boolean;
};

export const likeRestaurantImage = async (
  userId: string,
  imageId: string,
): Promise<ToggleRestaurantImageLikeResponse> => {
  const res = await fetch(`/api/restaurant/images/${imageId}/like`, {
    method: "POST",
    headers: {
      "x-user-id": userId,
    },
  });

  if (!res.ok) {
    throw new Error("Like failed");
  }

  const data = await res.json();
  return { likes: data.likes, liked: data.liked };
};
