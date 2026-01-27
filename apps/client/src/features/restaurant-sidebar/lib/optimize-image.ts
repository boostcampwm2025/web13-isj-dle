const DEFAULT_MAX_WIDTH = 800;
const DEFAULT_MAX_HEIGHT = 800;
const DEFAULT_QUALITY = 0.75;

type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

export const optimizeImage = async (file: File, options: OptimizeImageOptions = {}): Promise<File> => {
  const { maxWidth = DEFAULT_MAX_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT, quality = DEFAULT_QUALITY } = options;

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
