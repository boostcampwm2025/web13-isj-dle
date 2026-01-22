import {
  DEFAULT_INFO_MESSAGE,
  INVALID_SIZE_MESSAGE,
  INVALID_TYPE_MESSAGE,
  UPLOAD_ERROR_MESSAGE,
} from "../model/message.constants";
import { useImageAttachment } from "../model/use-image-attachment";
import { Camera } from "lucide-react";

import { useState } from "react";

type UploadError = string | null;

const ImageUploadButton = () => {
  const {
    accept,
    inputRef,
    file,
    previewUrl,
    error: attachError,
    openFileDialog,
    handleFileChange,
    handleDrop,
    handleDragOver,
    clear,
  } = useImageAttachment();

  const [uploadError, setUploadError] = useState<UploadError>(null);
  const [isDragging, setIsDragging] = useState(false);

  const message = (() => {
    if (attachError === "INVALID_TYPE") {
      return { type: "error" as const, text: INVALID_TYPE_MESSAGE };
    }
    if (attachError === "INVALID_SIZE") {
      return { type: "error" as const, text: INVALID_SIZE_MESSAGE };
    }
    if (uploadError) {
      return { type: "error" as const, text: uploadError };
    }
    if (!previewUrl) {
      return { type: "info" as const, text: DEFAULT_INFO_MESSAGE };
    }
    return null;
  })();

  const handleUpload = async () => {
    if (!file) return;

    try {
      // TODO: 실제 업로드 API
      // await uploadImage(file);

      clear();
      setUploadError(null);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setUploadError(e.message);
      } else {
        setUploadError(UPLOAD_ERROR_MESSAGE);
      }
    }
  };

  return (
    <section className="rounded-2xl bg-orange-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Camera className="h-4 w-4 text-orange-500" />
        <div className="text-sm font-semibold text-gray-800">음식 사진 업로드</div>
      </div>

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileChange} />

      <button
        type="button"
        onClick={openFileDialog}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => {
          setIsDragging(true);
          handleDragOver(e);
        }}
        onDrop={(e) => {
          setIsDragging(false);
          handleDrop(e);
        }}
        className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-4 text-center text-sm transition-colors ${
          isDragging
            ? "border-orange-500 bg-orange-100 text-orange-600"
            : "border-orange-300 bg-white text-gray-700 hover:bg-orange-100"
        } `}
      >
        <span className="font-semibold">{isDragging ? "Drop to upload" : "Drag or Click"}</span>
        <span className="text-xs text-gray-500">JPG, PNG · 최대 7MB</span>
      </button>

      {previewUrl && (
        <div className="mt-3 flex flex-col gap-2">
          <img src={previewUrl} alt="선택한 음식 사진 미리보기" className="h-30 w-full rounded-xl object-cover" />

          <button
            type="button"
            onClick={handleUpload}
            className="rounded-full bg-orange-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            게시하기
          </button>
        </div>
      )}

      {message && (
        <p
          className={`mt-3 text-xs leading-relaxed whitespace-pre-line ${
            message.type === "error" ? "text-red-500" : "text-gray-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
};

export default ImageUploadButton;
