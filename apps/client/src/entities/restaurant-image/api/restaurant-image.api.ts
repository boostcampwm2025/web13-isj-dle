export const fetchMyRestaurantImage = async (): Promise<{
  latestImage: string | null;
  images: string[];
}> => {
  const res = await fetch("/api/restaurant/images/me");
  if (!res.ok) {
    throw new Error("Failed to fetch images");
  }
  return res.json();
};

export const uploadRestaurantImage = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/restaurant/images", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }
};
