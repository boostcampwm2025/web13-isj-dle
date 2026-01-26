import type { GameScene } from "../core/game-scene";
import { GAME_SCENE_KEY } from "../model/game.constants";

import { useEffect, useRef, useState } from "react";

import { useUserStore } from "@entities/user";
import { SIDEBAR_TAB_WIDTH, SIDEBAR_WIDTH } from "@shared/config";
import { useSidebarStore } from "@widgets/sidebar";

interface MinimapOverlayProps {
  game: Phaser.Game | null;
}

const WIDTH = 200;
const HEIGHT = 140;
const HEADER = 24;
const MARGIN = 16;

export const MinimapOverlay = ({ game }: MinimapOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [mapSize, setMapSize] = useState({ width: 1, height: 1 });

  const isOpen = useSidebarStore((state) => state.isOpen);
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);

  const sidebarWidth = isOpen ? SIDEBAR_WIDTH : SIDEBAR_TAB_WIDTH;

  useEffect(() => {
    if (!game) return;

    let active = true;

    const poll = () => {
      if (!active) return;

      const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene | undefined;
      if (scene?.isReady && scene?.isLoadPlayer && scene?.mapInfo.map) {
        const map = scene.mapInfo.map;
        setMapSize({ width: map.widthInPixels, height: map.heightInPixels });

        const cam = scene.cameras.main;
        setPlayerPos({
          x: cam.scrollX + cam.width / 2,
          y: cam.scrollY + cam.height / 2,
        });
      }

      rafRef.current = requestAnimationFrame(poll);
    };

    poll();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [game]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !game) return;

    const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene | undefined;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (mapSize.width > 1 && mapSize.height > 1) {
      const scaleX = WIDTH / mapSize.width;
      const scaleY = HEIGHT / mapSize.height;
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = mapSize.width * scale;
      const scaledHeight = mapSize.height * scale;
      const offsetX = (WIDTH - scaledWidth) / 2;
      const offsetY = (HEIGHT - scaledHeight) / 2;

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(offsetX, offsetY, scaledWidth, scaledHeight);

      if (scene?.mapInfo.map) {
        const map = scene.mapInfo.map;

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
      }

      const mx = offsetX + playerPos.x * scale;
      const my = offsetY + playerPos.y * scale;

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
  }, [game, playerPos, mapSize]);

  return (
    <div
      className="pointer-events-none fixed overflow-hidden rounded-lg border border-slate-600/50 bg-slate-900/90 shadow-xl backdrop-blur-sm transition-all duration-300"
      style={{
        bottom: MARGIN,
        right: MARGIN + sidebarWidth,
        width: WIDTH,
        height: HEIGHT + HEADER,
        zIndex: 99999,
      }}
    >
      <div className="flex h-6 items-center justify-center border-b border-slate-700/50 bg-slate-800/80 text-[11px] font-medium text-slate-300">
        📍 {currentRoomId ?? "lobby"}
      </div>

      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="block" />
    </div>
  );
};
