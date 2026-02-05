import type { AvatarDirection } from "@shared/types";

import Phaser from "phaser";

export const getSeatPoints = (
  map: Phaser.Tilemaps.Tilemap | null,
  room: string,
): { x: number; y: number; direction: AvatarDirection }[] => {
  if (!map) throw new Error("Map not loaded");

  const seatPoints: { x: number; y: number; direction: AvatarDirection }[] = [];
  map.layers.forEach((layerData) => {
    const layer = layerData.tilemapLayer;
    if (!layer || !layerData.name.includes(room)) return;

    layer.forEachTile((tile) => {
      const properties = tile.properties;
      if (properties.type === "seat") {
        seatPoints.push({ x: tile.getCenterX(), y: tile.getCenterY(), direction: properties.direction });
      }
    });
  });

  if (seatPoints.length === 0) {
    throw new Error("No seat points found in the map");
  }

  return seatPoints;
};
