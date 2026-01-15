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

export async function loadTilesets(scene: Phaser.Scene, tmjUrl: string): Promise<void> {
  const res = await fetch(tmjUrl);
  if (!res.ok) throw new Error(`Failed to fetch tmj: ${res.status}`);
  const tmj = await res.json();

  for (const ts of tmj.tilesets) {
    if (!ts.image) {
      console.warn(`Tileset ${ts.name} has no image, skipping load.`);
      continue;
    }

    const base = new URL(tmjUrl, window.location.origin);
    scene.load.image(ts.name, new URL(ts.image, base).pathname);
  }

  await new Promise<void>((resolve, reject) => {
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
    scene.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => reject(file));
    scene.load.start();
  });
}
