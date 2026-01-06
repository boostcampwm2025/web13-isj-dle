import { GAME_SCENE_KEY, MAP_NAME, TMJ_URL } from "./game.constants";
import type { MapObj } from "./game.types";

export class GameScene extends Phaser.Scene {
  private mapObj: MapObj;

  constructor() {
    super({ key: GAME_SCENE_KEY });
    this.mapObj = {
      tmjUrl: TMJ_URL,
      name: MAP_NAME,
      map: null,
    };
  }

  get mapInfo(): Readonly<typeof this.mapObj> {
    return this.mapObj;
  }

  preload() {
    this.load.tilemapTiledJSON(this.mapObj.name, this.mapObj.tmjUrl);
  }

  async create() {
    try {
      await this.loadTilesets();

      const map = this.make.tilemap({ key: this.mapObj.name });
      this.mapObj.map = map;

      map.tilesets.map((ts) => map.addTilesetImage(ts.name));

      map.layers.forEach((layer) => {
        map.createLayer(layer.name, map.tilesets);
      });

      if (this.cameras.main && map) {
        const scaleX = this.cameras.main.width / map.widthInPixels;
        const scaleY = this.cameras.main.height / map.heightInPixels;
        const scale = Math.min(scaleX, scaleY);

        this.cameras.main.setZoom(scale);
        this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
      }
    } catch (error) {
      console.error("Error loading tilesets:", error);
    }
  }

  async loadTilesets() {
    const tmjUrl = this.mapObj.tmjUrl;
    const res = await fetch(tmjUrl);
    if (!res.ok) throw new Error(`Failed to fetch tmj: ${res.status}`);
    const tmj = await res.json();

    for (const ts of tmj.tilesets) {
      if (!ts.image) {
        console.warn(`Tileset ${ts.name} has no image, skipping load.`);
        continue;
      }

      const base = new URL(tmjUrl, window.location.origin);
      this.load.image(ts.name, new URL(ts.image, base).pathname);
    }

    await new Promise<void>((resolve, reject) => {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => reject(file));
      this.load.start();
    });
  }
}
