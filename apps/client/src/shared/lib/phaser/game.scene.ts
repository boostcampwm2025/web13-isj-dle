import {
  AVATAR_DEPTH,
  AVATAR_FRAME_HEIGHT,
  AVATAR_FRAME_WIDTH,
  GAME_SCENE_KEY,
  IDLE_BODY_FRAME,
  MAP_NAME,
  SIT_BODY_FRAME,
  TILE_SIZE,
  TMJ_URL,
  WALK_BODY_FRAME,
} from "./game.constants";
import type { AvatarEntity, MapObj, MoveKeys } from "./game.types";
import Phaser from "phaser";

import { AVATAR_ASSETS, type Avatar, type AvatarAssetKey, type AvatarDirection } from "@shared/types";

export class GameScene extends Phaser.Scene {
  private mapObj: MapObj;
  private avatar?: AvatarEntity;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: MoveKeys;
  private readonly moveSpeed = 100;

  constructor() {
    super({ key: GAME_SCENE_KEY });
    this.mapObj = {
      tmjUrl: TMJ_URL,
      name: MAP_NAME,
      map: null,
      depthCount: 0,
      zoom: {
        index: 3,
        levels: [1, 1.5, 1.75, 2, 2.25, 2.5, 3, 4, 5],
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
        frameWidth: AVATAR_FRAME_WIDTH,
        frameHeight: AVATAR_FRAME_HEIGHT,
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

      // mockAvatar
      const avatarModel: Avatar = {
        id: "avatar-1",
        x: map.widthInPixels / 2,
        y: map.heightInPixels / 2,
        currentRoomId: "lobby",
        direction: "down",
        state: "idle",
        assetKey: "ADAM",
      };

      this.avatar = await this.loadAvatar(avatarModel);
      if (!this.avatar) return;

      // camera 설정
      this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
      this.cameras.main.startFollow(this.avatar.sprite, true, 1.2, 1.2);

      this.input.on(
        "wheel",
        (_pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
          if (dy == 0) return;
          if (dy > 0) this.mapObj.zoom.index = Math.max(0, this.mapObj.zoom.index - 1);
          else this.mapObj.zoom.index = Math.min(this.mapObj.zoom.levels.length - 1, this.mapObj.zoom.index + 1);

          this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
        },
      );

      this.createAvatarAnimations(avatarModel.assetKey);

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
    if (!this.avatar) return;

    const { sprite, state } = this.avatar;

    if (state === "walk") return;

    const direction = this.getNextDirection();

    if (state === "sit") {
      if (direction) {
        this.avatar.state = "idle";
      } else return;
    }

    if (!direction) return;

    this.avatar.state = "walk";
    this.toWalk(sprite, direction);
    this.moveOneTile(direction);
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

  private moveOneTile(direction: AvatarDirection) {
    if (!this.avatar) return;

    const { sprite } = this.avatar;

    const dx = direction === "left" ? -TILE_SIZE : direction === "right" ? TILE_SIZE : 0;
    const dy = direction === "up" ? -TILE_SIZE : direction === "down" ? TILE_SIZE : 0;

    this.tweens.add({
      targets: sprite,
      x: sprite.x + dx,
      y: sprite.y + dy,
      duration: 150,
      onComplete: () => {
        this.avatar!.state = "idle";
        this.toIdle(sprite);
      },
    });
  }

  private toIdle(sprite: Phaser.Physics.Arcade.Sprite) {
    if (!this.avatar) return;
    sprite.anims.stop();
    sprite.setFrame(IDLE_BODY_FRAME[this.avatar.direction]);
  }

  private toWalk(sprite: Phaser.Physics.Arcade.Sprite, nextDirection: AvatarDirection) {
    if (!this.avatar) return;
    const animKey = `walk-${sprite.texture.key}-${nextDirection}`;

    const directionChanged = this.avatar.direction !== nextDirection;
    const shouldRestart = directionChanged || !sprite.anims.isPlaying;

    if (directionChanged) {
      this.avatar.direction = nextDirection;
    }

    if (shouldRestart) {
      sprite.anims.play(animKey, true);
    }
  }

  private trySit(): void {
    if (!this.avatar || !this.mapObj.map) return;

    const map = this.mapObj.map;
    const { x, y } = this.avatar.sprite;

    const tileX = map.worldToTileX(x);
    const tileY = map.worldToTileY(y + TILE_SIZE);

    if (tileX === null || tileY === null) return;

    for (const layerData of map.layers) {
      const layer = layerData.tilemapLayer;
      if (!layer) continue;

      const tile = layer.getTileAt(tileX, tileY);
      const seatDirection = this.getSeatDirection(tile);
      if (seatDirection) {
        const { sprite } = this.avatar;

        sprite.anims.stop();
        sprite.setFrame(SIT_BODY_FRAME[seatDirection]);
        this.avatar.state = "sit";
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
  loadAvatar(avatar: Avatar): AvatarEntity {
    const spawn = this.getAvatarSpawnPoint();

    const sprite = this.physics.add.sprite(spawn.x, spawn.y, avatar.assetKey, IDLE_BODY_FRAME[avatar.direction]);
    sprite.setDepth(AVATAR_DEPTH);
    return { sprite, direction: avatar.direction, state: avatar.state };
  }

  private getAvatarSpawnPoint() {
    const map = this.mapObj.map;
    const objectLayer = map?.getObjectLayer("ObjectLayer-Spawn");

    if (!objectLayer || objectLayer.objects.length === 0) {
      throw new Error("Spawn object layer not found");
    }

    const spawnObj = objectLayer.objects[0];

    return {
      x: spawnObj.x ?? 0,
      y: spawnObj.y ?? 0,
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
