import {
  GAME_SCENE_KEY,
  HEAD_FRAME,
  IDLE_BODY_FRAME,
  MAP_NAME,
  SIT_BODY_FRAME,
  TILE_SIZE,
  TMJ_URL,
  WALK_BODY_FRAME,
} from "./game.constants";
import type { MapObj, MoveKeys, Player } from "./game.types";
import Phaser from "phaser";

import { AVATAR_ASSETS, type Avatar, type AvatarAssetKey, type AvatarDirection } from "@shared/types";

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

      console.log(map);

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

      this.createAvatarAnimations(avatar.assetKey);

      // keyboard 처리
      const keyboard = this.input.keyboard;
      if (!keyboard) return;

      this.cursors = keyboard.createCursorKeys();

      const keys = keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        sit: Phaser.Input.Keyboard.KeyCodes.E,
      }) as MoveKeys;

      this.keys = keys;
    } catch (error) {
      console.error("Error loading tilesets:", error);
    }
  }

  update() {
    if (!this.player) return;

    const { container, body, state } = this.player;

    if (this.keys?.sit && Phaser.Input.Keyboard.JustDown(this.keys.sit) && state !== "sit") {
      this.trySit();
      return;
    }
    const nextDirection = this.getNextDirection();

    if (state === "sit" && nextDirection) {
      this.player.state = "idle";
    }

    if (this.player.state === "sit") {
      return;
    }

    if (nextDirection) {
      this.move(container, nextDirection);
      this.toWalk(body, nextDirection);
      this.player.state = "walk";
      return;
    }

    if (this.player.state !== "idle") {
      this.toIdle(body);
      this.player.state = "idle";
    }
  }

  // update helper(used by update)
  private getNextDirection(): AvatarDirection | null {
    const left = (this.cursors?.left?.isDown ?? false) || (this.keys?.left?.isDown ?? false);
    const right = (this.cursors?.right?.isDown ?? false) || (this.keys?.right?.isDown ?? false);
    const up = (this.cursors?.up?.isDown ?? false) || (this.keys?.up?.isDown ?? false);
    const down = (this.cursors?.down?.isDown ?? false) || (this.keys?.down?.isDown ?? false);

    if (left) return "left";
    if (right) return "right";
    if (up) return "up";
    if (down) return "down";
    return null;
  }

  private move(container: Phaser.GameObjects.Container, direction: AvatarDirection) {
    switch (direction) {
      case "left":
        container.x -= this.moveSpeed;
        break;
      case "right":
        container.x += this.moveSpeed;
        break;
      case "up":
        container.y -= this.moveSpeed;
        break;
      case "down":
        container.y += this.moveSpeed;
        break;
    }
  }

  private toIdle(body: Phaser.GameObjects.Sprite) {
    if (!this.player) return;
    body.anims.stop();
    body.setFrame(IDLE_BODY_FRAME[this.player.direction]);
  }

  private toWalk(body: Phaser.GameObjects.Sprite, nextDirection: AvatarDirection) {
    if (!this.player) return;
    const animKey = `walk-${body.texture.key}-${nextDirection}`;

    const directionChanged = this.player.direction !== nextDirection;
    const shouldRestart = directionChanged || !body.anims.isPlaying;

    if (directionChanged) {
      this.player.direction = nextDirection;
    }

    if (shouldRestart) {
      body.anims.play(animKey, true);
    }
  }

  private trySit(): void {
    if (!this.player || !this.mapObj.map) return;

    const map = this.mapObj.map;
    const { x, y } = this.player.container;

    const tileX = map.worldToTileX(x);
    const tileY = map.worldToTileY(y + TILE_SIZE);

    if (tileX === null || tileY === null) return;

    for (const layerData of map.layers) {
      const layer = layerData.tilemapLayer;
      if (!layer) continue;

      const tile = layer.getTileAt(tileX, tileY);
      const seatDirection = this.getSeatDirection(tile);
      if (seatDirection) {
        const { body } = this.player;

        body.anims.stop();
        body.setFrame(SIT_BODY_FRAME[seatDirection]);
        this.player.state = "sit";
        return;
      }
    }
  }

  private getSeatDirection(tile: Phaser.Tilemaps.Tile | null): AvatarDirection | null {
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
  }

  // Create / Setup helpers (used by create)
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

    return { container, body, head, direction: avatar.direction, state: "idle" };
  }

  private getPlayerSpawnPoint() {
    const map = this.mapObj.map;
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

  private createAvatarAnimations(assetKey: AvatarAssetKey) {
    const directions: AvatarDirection[] = ["down", "left", "right", "up"];

    directions.forEach((dir) => {
      const key = `walk-${assetKey}-${dir}`;
      if (this.anims.exists(key)) return;

      this.anims.create({
        key: `walk-${assetKey}-${dir}`,
        frames: WALK_BODY_FRAME[dir].map((frame) => ({
          key: assetKey,
          frame,
        })),
        frameRate: 8,
        repeat: -1,
      });
    });
  }
}
