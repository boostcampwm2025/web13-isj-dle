import {
  AVATAR_DEPTH,
  AVATAR_FRAME_HEIGHT,
  AVATAR_FRAME_WIDTH,
  GAME_SCENE_KEY,
  IDLE_FRAME,
  MAP_NAME,
  SIT_FRAME,
  TILE_SIZE,
  TMJ_URL,
  WALK_FRAME,
} from "./game.constants";
import type { AvatarEntity, MapObj, MoveKeys } from "./game.types";
import Phaser from "phaser";

import { AVATAR_ASSETS, type Avatar, type AvatarAssetKey, type AvatarDirection } from "@shared/types";

export class GameScene extends Phaser.Scene {
  private mapObj: MapObj;
  private avatar?: AvatarEntity;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: MoveKeys;

  private nextMoveAt = 0;
  private readonly MOVE_INTERVAL = 110;

  constructor() {
    super({ key: GAME_SCENE_KEY });
    this.mapObj = {
      tmjUrl: TMJ_URL,
      name: MAP_NAME,
      map: null,
      depthCount: 0,
      zoom: {
        index: 3,
        levels: [1, 2, 3, 4],
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
        x: map.widthInPixels,
        y: map.heightInPixels,
        currentRoomId: "lobby",
        direction: "down",
        state: "idle",
        assetKey: "AMELIA",
      };

      this.avatar = await this.loadAvatar(avatarModel);
      if (!this.avatar) return;

      // camera 설정
      this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
      this.cameras.main.startFollow(this.avatar.sprite, false);
      this.cameras.main.roundPixels = true;

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

  update(time: number) {
    if (!this.avatar) return;

    const { sprite, state } = this.avatar;

    // SIT 상태 처리
    if (state === "sit") {
      const inputDirection = this.getNextDirection();

      if (inputDirection) {
        this.avatar.state = "idle";
        this.avatar.direction = inputDirection;
        this.toIdle(sprite, inputDirection);
      }

      return;
    }

    // SIT 진입 처리
    if (this.keys?.sit && Phaser.Input.Keyboard.JustDown(this.keys.sit)) {
      const seatDirection = this.getSeatDirectionAtCurrentTile();
      if (seatDirection) {
        this.avatar.state = "sit";
        this.avatar.direction = seatDirection;
        this.toSit(sprite, seatDirection);
      }
      return;
    }

    const inputDirection = this.getNextDirection();

    if (inputDirection && inputDirection !== this.avatar.direction && this.avatar.state !== "walk") {
      this.avatar.direction = inputDirection;
      this.toIdle(sprite, inputDirection);
      return;
    }

    // 입력이 없으면 idle 유지
    if (!inputDirection) {
      if (this.avatar.state !== "idle") {
        this.avatar.state = "idle";
        this.toIdle(sprite, this.avatar.direction);
      }
      return;
    }

    // 이동 쿨타임
    if (time < this.nextMoveAt) {
      // 이동 중에는 walk 애니메이션만 유지
      if (this.avatar.state !== "walk") {
        this.avatar.state = "walk";
        this.toWalk(sprite, inputDirection);
      }
      return;
    }

    // 실제 이동 시점
    this.nextMoveAt = time + this.MOVE_INTERVAL;

    this.avatar.state = "walk";
    this.avatar.direction = inputDirection;
    this.toWalk(sprite, inputDirection);
    this.moveOneTile(sprite, inputDirection);
  }

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
  private moveOneTile(sprite: Phaser.Physics.Arcade.Sprite, direction: AvatarDirection) {
    const dx = direction === "left" ? -TILE_SIZE : direction === "right" ? TILE_SIZE : 0;
    const dy = direction === "up" ? -TILE_SIZE : direction === "down" ? TILE_SIZE : 0;

    sprite.setPosition(Math.round(sprite.x + dx), Math.round(sprite.y + dy));
  }

  private toIdle(sprite: Phaser.Physics.Arcade.Sprite, dir: AvatarDirection) {
    const key = `idle-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toWalk(sprite: Phaser.Physics.Arcade.Sprite, dir: AvatarDirection) {
    const key = `walk-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toSit(sprite: Phaser.Physics.Arcade.Sprite, dir: AvatarDirection) {
    sprite.anims.stop();
    sprite.setFrame(SIT_FRAME[dir]);
  }

  private getSeatDirectionAtCurrentTile(): AvatarDirection | null {
    if (!this.avatar || !this.mapObj.map) return null;

    const { sprite } = this.avatar;
    const map = this.mapObj.map;

    const tileX = map.worldToTileX(Math.round(sprite.x));
    const tileY = map.worldToTileY(Math.round(sprite.y));

    if (tileX == null || tileY == null) return null;

    for (const layerData of map.layers) {
      const tile = layerData.tilemapLayer?.getTileAt(tileX, tileY);
      const dir = this.getSeatDirection(tile);
      if (dir) return dir;
    }

    return null;
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

    const sprite = this.physics.add.sprite(spawn.x, spawn.y, avatar.assetKey, IDLE_FRAME[avatar.direction]);
    sprite.setDepth(AVATAR_DEPTH);
    sprite.setOrigin(0.5, 0.84);
    sprite.setOffset(0, 16);
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
      this.anims.create({
        key: `walk-${assetKey}-${dir}`,
        frames: WALK_FRAME[dir].map((frame) => ({
          key: assetKey,
          frame,
        })),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: `idle-${assetKey}-${dir}`,
        frames: [{ key: assetKey, frame: IDLE_FRAME[dir] }],
        frameRate: 1,
        repeat: -1,
      });
    });
  }
}
