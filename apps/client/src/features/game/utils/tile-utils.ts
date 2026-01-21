import Phaser from "phaser";

import type { AvatarDirection } from "@shared/types";

export const getTilesAtWorld = (map: Phaser.Tilemaps.Tilemap | null, x: number, y: number): Phaser.Tilemaps.Tile[] => {
  if (!map) return [];

  const tileX = map.worldToTileX(x);
  const tileY = map.worldToTileY(y);
  if (tileX == null || tileY == null) return [];

  const tiles: Phaser.Tilemaps.Tile[] = [];

  for (const layerData of map.layers) {
    const layer = layerData.tilemapLayer;
    if (!layer) continue;

    const tile = layer.getTileAt(tileX, tileY);
    if (tile) tiles.push(tile);
  }

  return tiles;
};

export const getCoordinateTileAtWorld = (
  map: Phaser.Tilemaps.Tilemap | null,
  x: number,
  y: number,
): { x: number; y: number } | null => {
  if (!map) return null;

  const tileX = map.worldToTileX(x);
  const tileY = map.worldToTileY(y);
  if (tileX == null || tileY == null) return null;

  return { x: tileX, y: tileY };
};

export const isSameTileAtWorld = (
  map: Phaser.Tilemaps.Tilemap | null,
  point1: { x: number; y: number },
  point2: { x: number; y: number },
): boolean => {
  if (!map) return false;

  const tile1 = getCoordinateTileAtWorld(map, point1.x, point1.y);
  const tile2 = getCoordinateTileAtWorld(map, point2.x, point2.y);
  if (!tile1 || !tile2) return false;

  if (tile1.x !== tile2.x || tile1.y !== tile2.y) return false;
  return true;
};

export const getSeatDirection = (tile: Phaser.Tilemaps.Tile | null): AvatarDirection | null => {
  if (!tile) return null;

  const properties = tile.properties;
  if (properties === null || typeof properties !== "object") return null;

  const type = (properties as { type?: unknown }).type;
  if (type !== "seat") return null;

  const direction = (properties as { direction?: unknown }).direction;
  if (direction === "up" || direction === "down" || direction === "left" || direction === "right") {
    return direction;
  }

  return null;
};

export const getSeatDirectionAtPosition = (
  map: Phaser.Tilemaps.Tilemap | null,
  x: number,
  y: number,
): AvatarDirection | null => {
  const tiles = getTilesAtWorld(map, Math.round(x), Math.round(y));

  for (const tile of tiles) {
    const dir = getSeatDirection(tile);
    if (dir) return dir;
  }

  return null;
};

export const isLecternTile = (tile: Phaser.Tilemaps.Tile | null): boolean => {
  if (!tile) return false;

  const props = tile.properties;
  if (props === null || typeof props !== "object") return false;

  const type = (props as { type?: unknown }).type;
  return type === "lectern";
};

export const isLecternAtPosition = (map: Phaser.Tilemaps.Tilemap | null, x: number, y: number): boolean => {
  const tiles = getTilesAtWorld(map, Math.round(x), Math.round(y));

  for (const tile of tiles) {
    if (isLecternTile(tile)) return true;
  }
  return false;
};
