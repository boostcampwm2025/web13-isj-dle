import { GAME_SCENE_KEY, HEAD_FRAME, IDLE_BODY_FRAME, MAP_NAME, TILE_SIZE, TMJ_URL } from "./game.constants";
import type { MapObj, MoveKeys, Player } from "./game.types";
import Phaser from "phaser";

import { AVATAR_ASSETS, type Avatar, type AvatarAssetKey } from "@shared/types";

export class GameScene extends Phaser.Scene {
  private mapObj: MapObj;
  private player?: Player;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: MoveKeys;
  private readonly moveSpeed = 1;

  constructor() {
    super({ key: GAME_SCENE_KEY });
    this.mapObj = {
      tmjUrl: TMJ_URL,
      name: MAP_NAME,
      map: null,
      depthCount: 0,
      zoom: {
        index: 3,
        levels: [1, 1.5, 2, 3, 4, 5, 6, 8],
      },
    };
  }

  get mapInfo(): Readonly<typeof this.mapObj> {
    return this.mapObj;
  }

  preload() {
    this.load.tilemapTiledJSON(this.mapObj.name, this.mapObj.tmjUrl);

    (Object.keys(AVATAR_ASSETS) as AvatarAssetKey[]).forEach((assetKey) => {
      const { url } = AVATAR_ASSETS[assetKey];

      this.load.spritesheet(assetKey, url, {
        frameWidth: TILE_SIZE,
        frameHeight: TILE_SIZE,
      });
    });
  }

  async create() {
    try {
      await this.loadTilesets();

      const map = this.make.tilemap({ key: this.mapObj.name });
      this.mapObj.map = map;

      map.tilesets.map((ts) => map.addTilesetImage(ts.name));

      map.layers.forEach(({ name }) => {
        const layer = map.createLayer(name, map.tilesets);
        if (!layer) throw new Error(`Layer ${name} could not be created.`);

        layer.setDepth(this.mapObj.depthCount++);
        if (name.includes("Collision")) {
          layer.setVisible(false);
          layer.setCollisionByProperty({ collides: true });
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

      this.player = await this.loadAvatar(avatar);
      if (!this.player) return;

      // keyboard 처리
      const keyboard = this.input.keyboard;
      if (!keyboard) return;

      this.cursors = keyboard.createCursorKeys();

      const keys = keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      }) as MoveKeys;

      this.keys = keys;
    } catch (error) {
      console.error("Error loading tilesets:", error);
    }
  }

  loadAvatar(avatar: Avatar): Player {
    if (!this.mapObj.map) {
      throw new Error("Map is not initialized");
    }

    const spawn = this.getPlayerSpawnPoint();

    const bodyFrame = IDLE_BODY_FRAME[avatar.direction];
    const headFrame = HEAD_FRAME[avatar.direction];

    const container = this.add.container(spawn.x, spawn.y);

    const body = this.add.sprite(0, 16, avatar.assetKey, bodyFrame);
    const head = this.add.sprite(0, 0, avatar.assetKey, headFrame);

    container.add([body, head]);
    container.setDepth(100);

    return { container, body, head };
  }

  private getPlayerSpawnPoint() {
    const map = this.mapObj.map;
    console.log(map);
    const objectLayer = map?.getObjectLayer("ObjectLayer-Spawn");

    if (!objectLayer || objectLayer.objects.length === 0) {
      throw new Error("Spawn object layer not found");
    }

    const spawnObj = objectLayer.objects[0];

    return {
      x: (spawnObj.x ?? 0) + TILE_SIZE,
      y: (spawnObj.y ?? 0) + TILE_SIZE,
    };
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

  update() {
    if (!this.player) return;

    const { container } = this.player;

    let dx = 0;
    let dy = 0;

    const left = (this.cursors?.left?.isDown ?? false) || (this.keys?.left?.isDown ?? false);
    const right = (this.cursors?.right?.isDown ?? false) || (this.keys?.right?.isDown ?? false);
    const up = (this.cursors?.up?.isDown ?? false) || (this.keys?.up?.isDown ?? false);
    const down = (this.cursors?.down?.isDown ?? false) || (this.keys?.down?.isDown ?? false);

    if (left) dx -= this.moveSpeed;
    if (right) dx += this.moveSpeed;
    if (up) dy -= this.moveSpeed;
    if (down) dy += this.moveSpeed;

    container.x += dx;
    container.y += dy;
  }
}
