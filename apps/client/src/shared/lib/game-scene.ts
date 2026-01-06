import { preloadAvatar } from "../../entities/avatar/lib/preload-avatar";
import { renderAvatar } from "../../entities/avatar/lib/render-avatar";
import type { Avatar } from "../../entities/avatar/model/avatar.types";
import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  private mapObj = {
    tmjUrl: "/assets/maps/world.tmj",
    name: "world_map",
    map: null as Phaser.Tilemaps.Tilemap | null,
  };

  private player?: {
    container: Phaser.GameObjects.Container;
    body: Phaser.GameObjects.Sprite;
    head: Phaser.GameObjects.Sprite;
  };

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    this.load.tilemapTiledJSON(this.mapObj.name, this.mapObj.tmjUrl);

    preloadAvatar({ load: this.load });
  }

  async create() {
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

    // mockAvatar
    const avatar: Avatar = {
      id: "player-1",
      x: map.widthInPixels / 2,
      y: map.heightInPixels / 2,
      currentRoomId: "lobby",
      direction: "down",
      assetKey: "ADAM",
    };

    const { container, body, head } = renderAvatar({
      scene: this,
      avatar,
    });

    container.setDepth(100);
    this.player = { container, body, head };
    this.player.container.setPosition(avatar.x, avatar.y);
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
