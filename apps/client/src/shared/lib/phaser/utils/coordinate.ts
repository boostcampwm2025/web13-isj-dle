import { TILE_SIZE } from "../game.constants";

export const worldToTile = (worldX: number, worldY: number) => {
  return {
    tileX: Math.floor(worldX / TILE_SIZE),
    tileY: Math.floor(worldY / TILE_SIZE),
  };
};

export const tileToWorld = (tileX: number, tileY: number) => {
  return {
    worldX: tileX * TILE_SIZE + TILE_SIZE / 2,
    worldY: tileY * TILE_SIZE + TILE_SIZE / 2,
  };
};
