import Phaser from "phaser";

export function getAvatarSpawnPoint(map: Phaser.Tilemaps.Tilemap | null): { x: number; y: number } {
  if (!map) throw new Error("Map not loaded");

  const objectLayer = map.getObjectLayer("ObjectLayer-Spawn");

  if (!objectLayer || objectLayer.objects.length === 0) {
    throw new Error("Spawn object layer not found");
  }

  const spawnObj = objectLayer.objects[0];

  return {
    x: spawnObj.x ?? 600,
    y: spawnObj.y ?? 968,
  };
}
