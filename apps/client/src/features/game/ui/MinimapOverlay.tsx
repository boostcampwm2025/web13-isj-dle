import type { GameScene } from "../core/game-scene";
import { GAME_SCENE_KEY, ROOM_JOIN_TOAST_OPTIONS } from "../model/game.constants";
import { DoorOpen } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useUserStore } from "@entities/user";
import { ICON_SIZE, ROOM_JOIN_TOAST_ID, isMeetingRoomRange } from "@shared/config";

interface MinimapOverlayProps {
  game: Phaser.Game | null;
  isHidden?: boolean;
}

const WIDTH = 160;
const HEIGHT = 140;
const HEADER = 24;
const MARGIN = 16;
const PADDING_Y = 8;

export const MinimapOverlay = ({ game, isHidden = false }: MinimapOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const mapCacheRef = useRef<HTMLCanvasElement | null>(null);
  const [mapSize, setMapSize] = useState({ width: 1, height: 1 });
  const [isMapReady, setIsMapReady] = useState(false);

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

  useEffect(() => {
    if (!game) return;

    let active = true;
    let checkHandle: number;

    const checkAndCacheMap = () => {
      if (!active) return;

      const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene | undefined;

      if (scene?.isReady && scene?.mapInfo.map) {
        const map = scene.mapInfo.map;
        const newMapSize = { width: map.widthInPixels, height: map.heightInPixels };

        setMapSize(newMapSize);

        const cacheCanvas = document.createElement("canvas");
        cacheCanvas.width = WIDTH;
        cacheCanvas.height = HEIGHT;
        const ctx = cacheCanvas.getContext("2d");

        if (!ctx) return;

        const scaleX = WIDTH / newMapSize.width;
        const scaleY = (HEIGHT - PADDING_Y * 2) / newMapSize.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = newMapSize.width * scale;
        const scaledHeight = newMapSize.height * scale;
        const offsetX = (WIDTH - scaledWidth) / 2;
        const offsetY = (HEIGHT - scaledHeight) / 2;

        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(offsetX, offsetY, scaledWidth, scaledHeight);

        map.layers.forEach((layerData) => {
          const layer = layerData.tilemapLayer;
          if (!layer || !layer.visible) return;

          const isCollision = layerData.name.includes("Collision");

          layer.forEachTile((tile) => {
            if (tile.index === -1) return;

            const tileX = offsetX + tile.pixelX * scale;
            const tileY = offsetY + tile.pixelY * scale;
            const tileSize = Math.max(1, map.tileWidth * scale);

            if (isCollision) {
              ctx.fillStyle = "rgba(100, 116, 139, 0.5)";
            } else {
              const hue = (tile.index * 30) % 360;
              ctx.fillStyle = `hsla(${hue}, 30%, 40%, 0.8)`;
            }

            ctx.fillRect(tileX, tileY, tileSize, tileSize);
          });
        });

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);

        mapCacheRef.current = cacheCanvas;
        setIsMapReady(true);
      } else {
        checkHandle = requestAnimationFrame(checkAndCacheMap);
      }
    };

    checkAndCacheMap();

    return () => {
      active = false;
      if (checkHandle) cancelAnimationFrame(checkHandle);
    };
  }, [game]);

  useEffect(() => {
    if (!game || !isMapReady) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !mapCacheRef.current) return;

    let active = true;

    const scaleX = WIDTH / mapSize.width;
    const scaleY = (HEIGHT - PADDING_Y * 2) / mapSize.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = mapSize.width * scale;
    const scaledHeight = mapSize.height * scale;
    const offsetX = (WIDTH - scaledWidth) / 2;
    const offsetY = (HEIGHT - scaledHeight) / 2;

    const render = () => {
      if (!active) return;

      const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene | undefined;

      if (scene?.isReady && scene?.isLoadPlayer) {
        ctx.drawImage(mapCacheRef.current!, 0, 0);

        const cam = scene.cameras.main;
        const playerX = cam.scrollX + cam.width / 2;
        const playerY = cam.scrollY + cam.height / 2;

        const dotRadius = 5;
        const rawMx = offsetX + playerX * scale;
        const rawMy = offsetY + playerY * scale;
        const mx = Math.max(offsetX + dotRadius, Math.min(offsetX + scaledWidth - dotRadius, rawMx));
        const my = Math.max(offsetY + dotRadius, Math.min(offsetY + scaledHeight - dotRadius, rawMy));

        ctx.beginPath();
        ctx.arc(mx + 1, my + 1, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [game, isMapReady, mapSize]);

  return (
    <div
      className="pointer-events-none fixed overflow-hidden rounded-lg border border-slate-600/50 bg-slate-900/90 shadow-xl backdrop-blur-sm transition-all duration-300"
      style={{
        bottom: MARGIN,
        left: MARGIN,
        width: WIDTH,
        height: HEIGHT + HEADER,
        zIndex: 99999,
        display: isHidden ? "none" : "block",
      }}
    >
      <div className="flex h-6 items-center justify-center border-b border-slate-700/50 bg-slate-800/80 text-[11px] font-medium text-slate-300">
        📍 {currentRoomId ?? "lobby"}
      </div>

      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block" />
    </div>
  );
};
