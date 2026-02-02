import type { GameScene } from "../core/game-scene";
import { GAME_SCENE_KEY } from "./game.constants";
import {
  EXPANDED_MAP_HEIGHT,
  EXPANDED_MAP_WIDTH,
  MINIMAP_HEIGHT,
  MINIMAP_PADDING_Y,
  MINIMAP_WIDTH,
} from "./minimap.constants";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseMinimapProps {
  game: Phaser.Game | null;
  isExpanded: boolean;
}

interface MapSize {
  width: number;
  height: number;
}

interface PlayerPosition {
  x: number;
  y: number;
}

const renderTilemapToCanvas = (
  ctx: CanvasRenderingContext2D,
  map: Phaser.Tilemaps.Tilemap,
  canvasWidth: number,
  canvasHeight: number,
  paddingY: number,
) => {
  const mapWidth = map.widthInPixels;
  const mapHeight = map.heightInPixels;

  const scaleX = canvasWidth / mapWidth;
  const scaleY = (canvasHeight - paddingY * 2) / mapHeight;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = mapWidth * scale;
  const scaledHeight = mapHeight * scale;
  const offsetX = (canvasWidth - scaledWidth) / 2;
  const offsetY = (canvasHeight - scaledHeight) / 2;

  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(Math.floor(offsetX), Math.floor(offsetY), Math.ceil(scaledWidth), Math.ceil(scaledHeight));

  map.layers.forEach((layerData) => {
    const layer = layerData.tilemapLayer;
    if (!layer || !layer.visible) return;

    const isCollision = layerData.name.includes("Collision");
    if (isCollision) return;

    layer.forEachTile((tile) => {
      if (tile.index === -1) return;

      const tileX = Math.floor(offsetX + tile.pixelX * scale);
      const tileY = Math.floor(offsetY + tile.pixelY * scale);
      const tileSize = Math.ceil(Math.max(1, map.tileWidth * scale));

      const tileset = tile.tileset;
      if (tileset && tileset.image) {
        const sourceImage = tileset.image.source[0]?.image as HTMLImageElement;
        if (sourceImage) {
          const localIndex = tile.index - tileset.firstgid;
          const columns = tileset.columns || Math.floor(sourceImage.width / tileset.tileWidth);
          const srcX = (localIndex % columns) * tileset.tileWidth;
          const srcY = Math.floor(localIndex / columns) * tileset.tileHeight;

          ctx.drawImage(
            sourceImage,
            srcX,
            srcY,
            tileset.tileWidth,
            tileset.tileHeight,
            tileX,
            tileY,
            tileSize,
            tileSize,
          );
        }
      }
    });
  });

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);
};

export const useMinimap = ({ game, isExpanded }: UseMinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const expandedCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const expandedRafRef = useRef<number | null>(null);
  const mapCacheRef = useRef<HTMLCanvasElement | null>(null);
  const expandedMapCacheRef = useRef<HTMLCanvasElement | null>(null);

  const [mapSize, setMapSize] = useState<MapSize>({ width: 1, height: 1 });
  const [isMapReady, setIsMapReady] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({ x: 0, y: 0 });

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
        cacheCanvas.width = MINIMAP_WIDTH;
        cacheCanvas.height = MINIMAP_HEIGHT;
        const ctx = cacheCanvas.getContext("2d");

        if (ctx) {
          renderTilemapToCanvas(ctx, map, MINIMAP_WIDTH, MINIMAP_HEIGHT, MINIMAP_PADDING_Y);
          mapCacheRef.current = cacheCanvas;
          setIsMapReady(true);
        }
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
    if (!game || !isMapReady || !isExpanded) return;

    const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene | undefined;
    if (!scene?.isReady || !scene?.mapInfo.map) return;

    const map = scene.mapInfo.map;
    const cacheCanvas = document.createElement("canvas");
    cacheCanvas.width = EXPANDED_MAP_WIDTH;
    cacheCanvas.height = EXPANDED_MAP_HEIGHT;
    const ctx = cacheCanvas.getContext("2d");

    if (ctx) {
      renderTilemapToCanvas(ctx, map, EXPANDED_MAP_WIDTH, EXPANDED_MAP_HEIGHT, MINIMAP_PADDING_Y);
      expandedMapCacheRef.current = cacheCanvas;
    }
  }, [game, isMapReady, isExpanded]);

  useEffect(() => {
    if (!game || !isMapReady) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !mapCacheRef.current) return;

    let active = true;

    const scaleX = MINIMAP_WIDTH / mapSize.width;
    const scaleY = (MINIMAP_HEIGHT - MINIMAP_PADDING_Y * 2) / mapSize.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = mapSize.width * scale;
    const scaledHeight = mapSize.height * scale;
    const offsetX = (MINIMAP_WIDTH - scaledWidth) / 2;
    const offsetY = (MINIMAP_HEIGHT - scaledHeight) / 2;

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

  useEffect(() => {
    if (!game || !isMapReady || !isExpanded || !expandedMapCacheRef.current) return;

    const canvas = expandedCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    let active = true;

    const scaleX = EXPANDED_MAP_WIDTH / mapSize.width;
    const scaleY = (EXPANDED_MAP_HEIGHT - MINIMAP_PADDING_Y * 2) / mapSize.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = mapSize.width * scale;
    const scaledHeight = mapSize.height * scale;
    const offsetX = (EXPANDED_MAP_WIDTH - scaledWidth) / 2;
    const offsetY = (EXPANDED_MAP_HEIGHT - scaledHeight) / 2;

    const render = () => {
      if (!active) return;

      const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene | undefined;

      if (scene?.isReady && scene?.isLoadPlayer) {
        ctx.drawImage(expandedMapCacheRef.current!, 0, 0);

        const cam = scene.cameras.main;
        const playerX = cam.scrollX + cam.width / 2;
        const playerY = cam.scrollY + cam.height / 2;

        const dotRadius = 8;
        const rawMx = offsetX + playerX * scale;
        const rawMy = offsetY + playerY * scale;
        const mx = Math.max(offsetX + dotRadius, Math.min(offsetX + scaledWidth - dotRadius, rawMx));
        const my = Math.max(offsetY + dotRadius, Math.min(offsetY + scaledHeight - dotRadius, rawMy));

        setPlayerPosition({ x: mx, y: my });
      }

      expandedRafRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (expandedRafRef.current) cancelAnimationFrame(expandedRafRef.current);
    };
  }, [game, isMapReady, isExpanded, mapSize]);

  return {
    canvasRef,
    expandedCanvasRef,
    mapSize,
    isMapReady,
    playerPosition,
  };
};

export const useMinimapToggle = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "m" || e.key === "M") {
        setIsExpanded((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openMinimap = useCallback(() => setIsExpanded(true), []);
  const closeMinimap = useCallback(() => setIsExpanded(false), []);
  const toggleMinimap = useCallback(() => setIsExpanded((prev) => !prev), []);

  return {
    isExpanded,
    openMinimap,
    closeMinimap,
    toggleMinimap,
  };
};
