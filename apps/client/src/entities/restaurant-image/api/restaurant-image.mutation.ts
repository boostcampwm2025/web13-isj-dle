export const uploadRestaurantImage = async (userId: number, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/restaurant/images", {
    method: "POST",
    headers: {
      "x-user-id": userId.toString(),
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
  userId: number,
  imageUrl: string,
  newImageUrl: string,
): Promise<string> => {
  const res = await fetch("/api/restaurant/images", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId.toString(),
    },
    body: JSON.stringify({ imageUrl, newImageUrl }),
  });

  if (!res.ok) {
    throw new Error("Update failed");
  }

  const data = await res.json();
  return data.imageUrl;
};

export const deleteRestaurantImage = async (userId: number, imageUrl: string): Promise<void> => {
  const res = await fetch("/api/restaurant/images", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId.toString(),
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
  userId: number,
  imageId: string,
): Promise<ToggleRestaurantImageLikeResponse> => {
  const res = await fetch(`/api/restaurant/images/${imageId}/like`, {
    method: "POST",
    headers: {
      "x-user-id": userId.toString(),
    },
  });

  if (!res.ok) {
    throw new Error("Like failed");
  }

  const data = await res.json();
  return { likes: data.likes, liked: data.liked };
};
