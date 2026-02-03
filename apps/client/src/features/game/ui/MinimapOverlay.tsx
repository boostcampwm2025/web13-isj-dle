import { ROOM_JOIN_TOAST_OPTIONS } from "../model/game.constants";
import {
  LOCATION_AREAS,
  MINIMAP_HEADER,
  MINIMAP_HEIGHT,
  MINIMAP_MARGIN,
  MINIMAP_PADDING_Y,
  MINIMAP_WIDTH,
} from "../model/minimap.constants";
import { calculateMinimapScale } from "../model/minimap.utils";
import { useMinimap, useMinimapToggle } from "../model/use-minimap";
import { Tag, X } from "lucide-react";
import { DoorOpen } from "lucide-react";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useUserStore } from "@entities/user";
import { ICON_SIZE, ROOM_JOIN_TOAST_ID, isMeetingRoomRange } from "@shared/config";

interface MinimapOverlayProps {
  game: Phaser.Game | null;
  isHidden?: boolean;
}

export const MinimapOverlay = ({ game, isHidden = false }: MinimapOverlayProps) => {
  const [hoveredArea, setHoveredArea] = useState<number | null>(null);
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);

  useEffect(() => {
    if (!currentRoomId || currentRoomId === "lobby" || isMeetingRoomRange(currentRoomId)) {
      toast.dismiss(ROOM_JOIN_TOAST_ID);
      return;
    }

    toast(`${currentRoomId}에 입장했습니다.`, {
      ...ROOM_JOIN_TOAST_OPTIONS,
      icon: <DoorOpen size={ICON_SIZE} className="text-blue-600" />,
    });
  }, [currentRoomId]);

  const { isExpanded, openMinimap, closeMinimap } = useMinimapToggle();
  const { canvasRef, expandedCanvasRef, mapSize, isMapReady, playerPosition, expandedDimensions } = useMinimap({
    game,
    isExpanded,
  });

  return (
    <>
      <div
        data-tutorial="minimap"
        className="pointer-events-auto fixed cursor-pointer overflow-hidden rounded-lg border border-slate-600/50 bg-slate-900/90 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-slate-500/70 hover:shadow-2xl"
        style={{
          bottom: MINIMAP_MARGIN,
          left: MINIMAP_MARGIN,
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT + MINIMAP_HEADER,
          zIndex: 99999,
          display: isHidden ? "none" : "block",
        }}
        onClick={openMinimap}
        title="클릭하여 지도 확대 (단축키: M)"
      >
        <div className="flex h-6 items-center justify-center border-b border-slate-700/50 bg-slate-800/80 text-[11px] font-medium text-slate-300">
          📍 {currentRoomId ?? "lobby"}
        </div>

        <canvas ref={canvasRef} width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} className="block" />
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeMinimap}
        >
          <div
            className="relative overflow-hidden rounded-xl border border-slate-600/50 bg-slate-900/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-10 items-center justify-between border-b border-slate-700/50 bg-slate-800/80 px-4">
              <span className="text-sm font-medium text-slate-200">전체 지도</span>
              <button
                onClick={closeMinimap}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 border-b border-slate-700/30 bg-gradient-to-r from-slate-800/60 via-slate-800/40 to-slate-800/60 px-4 py-2.5">
              <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 ring-1 ring-green-500/30">
                <div className="relative flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white/80" />
                </div>
                <span className="text-xs font-medium text-green-400">현재 위치</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 ring-1 ring-cyan-500/30">
                <Tag size={14} className="text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400">영역에 마우스를 올려보세요</span>
              </div>
            </div>

            <div className="relative">
              <canvas
                ref={expandedCanvasRef}
                width={expandedDimensions.width}
                height={expandedDimensions.height}
                className="block"
              />

              {isMapReady &&
                (() => {
                  const {
                    scale,
                    offsetX: mapOffsetX,
                    offsetY: mapOffsetY,
                  } = calculateMinimapScale(
                    mapSize.width,
                    mapSize.height,
                    expandedDimensions.width,
                    expandedDimensions.height,
                    MINIMAP_PADDING_Y,
                  );

                  return LOCATION_AREAS.map((area, index) => {
                    const areaX = mapOffsetX + area.x * scale;
                    const areaY = mapOffsetY + area.y * scale;
                    const areaWidth = area.width * scale;
                    const areaHeight = area.height * scale;
                    const isHovered = hoveredArea === index;
                    const isRightSide = area.x + area.width > mapSize.width * 0.7;

                    return (
                      <div
                        key={index}
                        className="pointer-events-auto absolute transition-all duration-200"
                        style={{
                          left: areaX,
                          top: areaY,
                          width: areaWidth,
                          height: areaHeight,
                        }}
                        onMouseEnter={() => setHoveredArea(index)}
                        onMouseLeave={() => setHoveredArea(null)}
                      >
                        <div
                          className={`absolute inset-0 rounded-lg border-2 transition-all duration-200 ${
                            isHovered
                              ? "border-cyan-400/80 bg-cyan-400/20 shadow-lg shadow-cyan-500/30"
                              : "border-transparent bg-transparent"
                          }`}
                        />
                        {isHovered && (
                          <div
                            className={`animate-fade-in pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 rounded-lg border border-cyan-400/60 bg-slate-900/95 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-cyan-300 shadow-xl ${
                              isRightSide ? "right-full mr-2" : "left-full ml-2"
                            }`}
                            style={{
                              animation: "fadeIn 0.15s ease-out",
                            }}
                          >
                            {area.name}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

              {playerPosition.x > 0 && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: playerPosition.x,
                    top: playerPosition.y,
                  }}
                >
                  <span className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-green-400 opacity-40" />
                  <span
                    className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-green-400/20"
                    style={{ animationDuration: "1.5s" }}
                  />
                  <span className="relative block h-3 w-3 rounded-full bg-green-500 shadow-lg ring-2 ring-white" />
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap text-green-400 drop-shadow-lg">
                    현재 위치
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-700/30 bg-slate-800/40 px-4 py-2 text-center text-xs text-slate-500">
              배경을 클릭하거나 X 버튼을 눌러 닫기 (단축키: M)
            </div>
          </div>
        </div>
      )}
    </>
  );
};
