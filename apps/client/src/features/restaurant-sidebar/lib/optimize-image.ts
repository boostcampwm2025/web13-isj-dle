import { IMAGE_OPTIMIZE_MAX_HEIGHT, IMAGE_OPTIMIZE_MAX_WIDTH, IMAGE_OPTIMIZE_QUALITY } from "@shared/types";

type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

export const optimizeImage = async (file: File, options: OptimizeImageOptions = {}): Promise<File> => {
  const {
    maxWidth = IMAGE_OPTIMIZE_MAX_WIDTH,
    maxHeight = IMAGE_OPTIMIZE_MAX_HEIGHT,
    quality = IMAGE_OPTIMIZE_QUALITY,
  } = options;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  let targetWidth = width;
  let targetHeight = height;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    targetWidth = Math.round(width * ratio);
    targetHeight = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/webp", quality });

  const originalName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${originalName}.webp`, { type: "image/webp" });
};
