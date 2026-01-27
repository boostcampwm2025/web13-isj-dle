export type PresignRestaurantImageResponse = {
  key: string;
  uploadUrl: string;
  imageUrl: string;
  viewUrl?: string;
};

export const uploadPresignRestaurantImage = async (
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
