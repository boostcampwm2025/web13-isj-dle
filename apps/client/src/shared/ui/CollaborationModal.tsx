import { X } from "lucide-react";

import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

import { ICON_SIZE, SIDEBAR_ANIMATION_DURATION, SIDEBAR_TAB_WIDTH, SIDEBAR_WIDTH } from "@shared/config";
import { useSidebarStore } from "@widgets/sidebar";

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  headerControls?: ReactNode;
}

const CollaborationModal = ({ isOpen, onClose, title, children, headerControls }: CollaborationModalProps) => {
  const isSidebarOpen = useSidebarStore((s) => s.isOpen);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-[right] ease-in-out"
      style={{
        right: isSidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_TAB_WIDTH,
        transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
      }}
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-[90%] max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>

          <div className="flex items-center gap-4">
            {headerControls}

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="닫기"
            >
              <X size={ICON_SIZE} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default CollaborationModal;
