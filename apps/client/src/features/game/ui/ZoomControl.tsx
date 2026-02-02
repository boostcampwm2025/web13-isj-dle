import { ZoomIn, ZoomOut } from "lucide-react";

import { ZOOM_LEVELS, useZoomStore } from "@features/game";

interface ZoomControl {
  isHidden?: boolean;
  onZoomChange?: () => void;
}

const MARGIN = 16;

export const ZoomControl = ({ isHidden = false, onZoomChange }: ZoomControl) => {
  const zoomIndex = useZoomStore((state) => state.zoomIndex);
  const zoomIn = useZoomStore((state) => state.zoomIn);
  const zoomOut = useZoomStore((state) => state.zoomOut);
  const getZoomPercentage = useZoomStore((state) => state.getZoomPercentage);

  const handleZoomIn = () => {
    zoomIn();
    onZoomChange?.();
  };

  const handleZoomOut = () => {
    zoomOut();
    onZoomChange?.();
  };

  const isMinZoom = zoomIndex === 0;
  const isMaxZoom = zoomIndex === ZOOM_LEVELS.length - 1;

  return (
    <div
      className="pointer-events-auto fixed flex flex-col overflow-hidden rounded-lg border border-slate-600/50 bg-slate-900/90 shadow-xl backdrop-blur-sm transition-all duration-300"
      style={{
        top: MARGIN,
        left: MARGIN,
        zIndex: 99999,
        display: isHidden ? "none" : "flex",
      }}
    >
      {/* Zoom Out 버튼 (위) */}
      <button
        onClick={handleZoomOut}
        disabled={isMinZoom}
        className="flex h-8 w-10 items-center justify-center border-b border-slate-700/50 text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        title="축소"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      {/* 현재 배율 표시 (중간) */}
      <div className="flex h-8 w-10 items-center justify-center border-b border-slate-700/50 bg-slate-800/80 text-[11px] font-medium text-slate-300">
        {getZoomPercentage()}%
      </div>

      {/* Zoom In 버튼 (아래) */}
      <button
        onClick={handleZoomIn}
        disabled={isMaxZoom}
        className="flex h-8 w-10 items-center justify-center text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        title="확대"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
    </div>
  );
};
