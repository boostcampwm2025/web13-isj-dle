import {
  AVATAR_FRAME_HEIGHT,
  AVATAR_FRAME_WIDTH,
  AVATAR_MOVE_SPEED,
  AVATAR_SNAP_SPEED,
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
          // layer.setVisible(false);
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
        assetKey: "BOB",
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

  update() {
    if (!this.avatar) return;

    const { sprite, state } = this.avatar;

    // SIT 상태 처리
    if (state === "sit") {
      const inputDirection = this.getNextDirection();

      if (inputDirection.direction) {
        this.avatar.state = "idle";
        this.avatar.direction = inputDirection.direction;
        this.toIdle(sprite, inputDirection.direction);
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

    if (!this.avatar || !this.cursors) return;

    const inputDirection = this.getNextDirection();

    this.avatar.sprite.setVelocity(inputDirection.vx, inputDirection.vy);

    if (inputDirection.direction) {
      this.toWalk(sprite, inputDirection.direction);
      this.avatar.direction = inputDirection.direction;
    } else this.toIdle(this.avatar.sprite, this.avatar.direction);

    if (inputDirection.vx === 0 && inputDirection.vy === 0) {
      const x = this.avatar.sprite.x;
      const y = this.avatar.sprite.y;

      const targetX = Math.floor(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
      const targetY = Math.floor(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

      this.avatar.sprite.setPosition(
        Phaser.Math.Linear(x, targetX, AVATAR_SNAP_SPEED),
        Phaser.Math.Linear(y, targetY, AVATAR_SNAP_SPEED),
      );
    }
  }

  // Input / Animation
  private getNextDirection(): { vx: number; vy: number; direction: AvatarDirection | null } {
    if (!this.cursors || !this.keys) return { vx: 0, vy: 0, direction: null };

    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;
    const up = this.cursors.up.isDown || this.keys.up.isDown;
    const down = this.cursors.down.isDown || this.keys.down.isDown;

    if (left) return { vx: -AVATAR_MOVE_SPEED, vy: 0, direction: "left" };
    if (right) return { vx: AVATAR_MOVE_SPEED, vy: 0, direction: "right" };
    if (up) return { vx: 0, vy: -AVATAR_MOVE_SPEED, direction: "up" };
    if (down) return { vx: 0, vy: AVATAR_MOVE_SPEED, direction: "down" };
    return { vx: 0, vy: 0, direction: null };
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

  // Tile helpers
  private getTilesAtWorld(x: number, y: number): Phaser.Tilemaps.Tile[] {
    const map = this.mapObj.map;
    if (!map) return [];

    const tileX = map.worldToTileX(x);
    const tileY = map.worldToTileY(y);
    if (tileX == null || tileY == null) return [];

    const tiles: Phaser.Tilemaps.Tile[] = [];

    for (const layerData of map.layers) {
      const layer = layerData.tilemapLayer;
      if (!layer) continue;

      const tile = layer.getTileAt(tileX, tileY);
      if (tile) tiles.push(tile);
    }

    return tiles;
  }

  private getSeatDirectionAtCurrentTile(): AvatarDirection | null {
    if (!this.avatar) return null;

    const { sprite } = this.avatar;
    const tiles = this.getTilesAtWorld(Math.round(sprite.x), Math.round(sprite.y));

    for (const tile of tiles) {
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
    sprite.setDepth(this.mapObj.depthCount);
    sprite.setOrigin(0.5, 0.75);
    sprite.body.setSize(TILE_SIZE - 2, TILE_SIZE - 2);
    sprite.body.setOffset(1, TILE_SIZE + 1);

    this.mapObj.map?.layers.forEach(({ tilemapLayer }) => {
      if (!tilemapLayer) return;
      this.physics.add.collider(sprite, tilemapLayer);
    });

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
