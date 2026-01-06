import { GAME_SCENE_KEY, MAP_NAME, TMJ_URL } from "./game.constants";
import type { MapObj } from "./game.types";
import { preloadAvatar } from "./preload-avatar";
import { renderAvatar } from "./render-avatar";
import Phaser from "phaser";

import type { Avatar } from "@shared/types";

export class GameScene extends Phaser.Scene {
  private mapObj: MapObj;

  private player?: {
    container: Phaser.GameObjects.Container;
    body: Phaser.GameObjects.Sprite;
    head: Phaser.GameObjects.Sprite;
  };

  constructor() {
    super({ key: GAME_SCENE_KEY });
    this.mapObj = {
      tmjUrl: TMJ_URL,
      name: MAP_NAME,
      map: null,
      depthCount: 0,
      zoom: {
        index: 5,
        levels: [0.75, 1, 1.5, 2, 3, 4, 5, 6, 8],
      },
    };
  }

  get mapInfo(): Readonly<typeof this.mapObj> {
    return this.mapObj;
  }

  preload() {
    this.load.tilemapTiledJSON(this.mapObj.name, this.mapObj.tmjUrl);

    preloadAvatar({ load: this.load });
  }

  async create() {
    try {
      await this.loadTilesets();

      const map = this.make.tilemap({ key: this.mapObj.name });
      this.mapObj.map = map;

      map.tilesets.map((ts) => map.addTilesetImage(ts.name));

      map.layers.forEach(({ name }) => {
        const layer = map.createLayer(name, map.tilesets);
        layer!.setDepth(this.mapObj.depthCount++);
        if (name.includes("Collision")) {
          layer!.setVisible(false);
        }
      });

      this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
      this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);

      this.input.on(
        "wheel",
        (_pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
          if (dy == 0) return;
          if (dy > 0) this.mapObj.zoom.index = Math.max(0, this.mapObj.zoom.index - 1);
          else this.mapObj.zoom.index = Math.min(this.mapObj.zoom.levels.length - 1, this.mapObj.zoom.index + 1);

          this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
        },
      );

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
