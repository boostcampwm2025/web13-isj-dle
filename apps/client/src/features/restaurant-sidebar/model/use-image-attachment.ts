import { optimizeImage } from "../lib/optimize-image";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

export type ImageAttachError = "INVALID_TYPE" | "INVALID_SIZE" | "OPTIMIZE_FAILED";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DEFAULT_MAX_SIZE_MB = 7;
export const DEFAULT_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

export const validateImageFile = (file: File, maxSizeMB: number = DEFAULT_MAX_SIZE_MB): ImageAttachError | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "INVALID_TYPE";
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return "INVALID_SIZE";
  }
  return null;
};

type UseImageAttachmentOptions = {
  accept?: string;
  maxSizeMB?: number;
};

export const useImageAttachment = (options: UseImageAttachmentOptions = {}) => {
  const { accept = DEFAULT_ACCEPT, maxSizeMB = DEFAULT_MAX_SIZE_MB } = options;

  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<ImageAttachError | null>(null);

  const clear = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setFile(null);
    setPreviewUrl(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    async (nextFile: File | null) => {
      if (!nextFile) return;

      const validationError = validateImageFile(nextFile, maxSizeMB);
      if (validationError) {
        clear();
        setError(validationError);
        return;
      }

      clear();

      try {
        const optimized = await optimizeImage(nextFile);

        const objectUrl = URL.createObjectURL(optimized);
        objectUrlRef.current = objectUrl;

        setFile(optimized);
        setPreviewUrl(objectUrl);
      } catch {
        setError("OPTIMIZE_FAILED");
      }
    },
    [clear, maxSizeMB],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextFile = e.target.files?.[0] ?? null;
      handleFile(nextFile);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      const nextFile = e.dataTransfer.files?.[0] ?? null;
      handleFile(nextFile);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  return {
    accept,
    inputRef,
    file,
    previewUrl,
    error,
    openFileDialog,
    handleFileChange,
    handleDrop,
    handleDragOver,
    clear,
  };
};
