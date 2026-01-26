import { INVALID_SIZE_MESSAGE, INVALID_TYPE_MESSAGE } from "../model/message.constants";
import { DEFAULT_ACCEPT, validateImageFile } from "../model/use-image-attachment";
import { Pencil, Trash2, X } from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  restaurantImageKeys,
  useDeleteRestaurantImageMutation,
  useReplaceRestaurantImageMutation,
  useRestaurantImageViewStore,
} from "@entities/restaurant-image";
import { useUserStore } from "@entities/user";
import { ICON_SIZE, SIDEBAR_TAB_WIDTH, SIDEBAR_WIDTH } from "@shared/config";
import { useQueryClient } from "@tanstack/react-query";
import { useSidebarStore } from "@widgets/sidebar";

const VIEWER_ICON_SIZE = ICON_SIZE - 4;
type ImageViewerModalProps = {
  onDelete: (deletedUrl: string) => void;
  onUpdate: (oldUrl: string, newUrl: string) => void;
};

const ImageViewerModal = ({ onDelete, onUpdate }: ImageViewerModalProps) => {
  const { targetUserId, imageUrl, isOpen, closeViewer } = useRestaurantImageViewStore();
  const userId = useUserStore((state) => state.user?.id);
  const isSidebarOpen = useSidebarStore((s) => s.isOpen);
  const queryClient = useQueryClient();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteMutation = useDeleteRestaurantImageMutation(userId ?? null);
  const replaceMutation = useReplaceRestaurantImageMutation(userId ?? null);

  const isOwner = useMemo(() => targetUserId !== null && targetUserId === userId, [targetUserId, userId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeViewer();
        if (userId) queryClient.invalidateQueries({ queryKey: restaurantImageKeys.my(userId) }).catch(() => undefined);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeViewer, queryClient, userId]);

  const handleDelete = useCallback(async () => {
    if (!userId || !imageUrl) return;

    const confirmed = window.confirm("이미지를 삭제하시겠습니까?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(imageUrl);
      onDelete(imageUrl);
      closeViewer();
    } catch {
      alert("이미지 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }

    queryClient.invalidateQueries({ queryKey: restaurantImageKeys.my(userId) }).catch(() => undefined);
  }, [userId, imageUrl, closeViewer, onDelete, queryClient, deleteMutation]);

  const handleEdit = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !userId || !imageUrl || isDeleting || isUpdating) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        const message = validationError === "INVALID_TYPE" ? INVALID_TYPE_MESSAGE : INVALID_SIZE_MESSAGE;
        alert(message);
        return;
      }

      setIsUpdating(true);
      try {
        const newUrl = await replaceMutation.mutateAsync({ imageUrl, file });
        onUpdate(imageUrl, newUrl);
        closeViewer();
      } catch {
        alert("이미지 수정에 실패했습니다.");
      } finally {
        setIsUpdating(false);
      }
    },
    [userId, imageUrl, closeViewer, onUpdate, isDeleting, isUpdating, replaceMutation],
  );

  if (!isOpen || !imageUrl) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ right: isSidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_TAB_WIDTH }}
      onClick={closeViewer}
    >
      <div
        className="relative flex max-h-[60vh] max-w-[50vw] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {isOwner && (
            <>
              <button
                onClick={handleEdit}
                disabled={isDeleting || isUpdating}
                className="rounded-lg bg-white/90 p-2 text-gray-600 shadow-md transition-colors hover:bg-white hover:text-blue-600"
                aria-label="수정"
              >
                <Pencil size={VIEWER_ICON_SIZE} />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || isUpdating}
                className="rounded-lg bg-white/90 p-2 text-gray-600 shadow-md transition-colors hover:bg-white hover:text-red-600"
                aria-label="삭제"
              >
                <Trash2 size={VIEWER_ICON_SIZE} />
              </button>
            </>
          )}
          <button
            onClick={closeViewer}
            className="rounded-lg bg-white/90 p-2 text-gray-600 shadow-md transition-colors hover:bg-white hover:text-gray-800"
            aria-label="닫기"
          >
            <X size={VIEWER_ICON_SIZE} />
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept={DEFAULT_ACCEPT} onChange={handleFileChange} className="hidden" />

        <img src={imageUrl} alt="이미지 미리보기" className="max-h-[60vh] max-w-[50vw] rounded-xl object-contain" />
      </div>
    </div>,
    document.body,
  );
};

export default ImageViewerModal;
