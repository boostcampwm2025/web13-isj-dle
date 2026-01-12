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
import type { Socket } from "socket.io-client";

import {
  AVATAR_ASSETS,
  type Avatar,
  type AvatarAssetKey,
  type AvatarDirection,
  type AvatarState,
  type User,
  UserEventType,
} from "@shared/types";
import { isMeetingRoomRange } from "@src/shared/config/room.config";

export class GameScene extends Phaser.Scene {
  public isReady: boolean = false;
  private mapObj: MapObj;
  private avatar?: AvatarEntity;
  private avatars: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: MoveKeys;
  private socket?: Socket;
  private lastEmitted: { x: number; y: number; direction: AvatarDirection; state: AvatarState; time: number } = {
    x: 0,
    y: 0,
    direction: "down",
    state: "idle",
    time: 0,
  };
  private threshold: number = 16; // milliseconds
  private currentRoomId: string = "lobby";

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

  get isLoadPlayer(): boolean {
    return !!this.avatar;
  }

  get isInitializedSocket(): boolean {
    return !!this.socket;
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

      this.input.on(
        "wheel",
        (_pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
          if (dy == 0) return;
          if (dy > 0) this.mapObj.zoom.index = Math.max(0, this.mapObj.zoom.index - 1);
          else this.mapObj.zoom.index = Math.min(this.mapObj.zoom.levels.length - 1, this.mapObj.zoom.index + 1);

          this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
        },
      );

      this.createAllAvatarAnimations();

      // keyboard 처리
      const keyboard = this.input.keyboard;
      if (!keyboard) return;

      this.cursors = keyboard.createCursorKeys();

      this.keys = keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        sit: Phaser.Input.Keyboard.KeyCodes.E,
      }) as MoveKeys;

      this.isReady = true;
      this.events.emit("scene:ready");
    } catch (error) {
      console.error("Error loading tilesets:", error);
    }
  }

  update() {
    if (!this.avatar || !this.cursors) return;
    this.emitPlayerPosition();

    const inputDirection = this.getNextDirection();

    // 방 진입 체크
    this.checkRoomEntrance();

    // SIT 상태 처리
    if (this.avatar.state === "sit" && !inputDirection) {
      return;
    }

    // SIT 진입 처리
    if (this.keys?.sit.isDown) {
      const seatDirection = this.getSeatDirectionAtCurrentTile();
      if (seatDirection) {
        this.avatar.state = "sit";
        this.avatar.direction = seatDirection;
        this.toSit(this.avatar.sprite, seatDirection);
        return;
      }
    }

    // Walking / Idle 상태 처리
    if (inputDirection) {
      this.avatar.state = "walk";
      this.avatar.direction = inputDirection;
      this.toWalk(this.avatar.sprite, inputDirection);
    } else {
      this.avatar.state = "idle";
      this.toIdle(this.avatar.sprite, this.avatar.direction);
    }

    // 이동 처리
    const { vx, vy } = this.dirToVel(inputDirection);
    this.avatar.sprite.setVelocity(vx, vy);

    // Snap to grid 처리
    if (vx === 0 && vy === 0) {
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
  private getNextDirection(): AvatarDirection | null {
    if (!this.cursors || !this.keys) return null;

    const down = this.cursors.down.isDown || this.keys.down.isDown;
    const up = this.cursors.up.isDown || this.keys.up.isDown;
    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;

    const pressed: Record<AvatarDirection, boolean> = { up, down, left, right };

    const fallback = (["left", "right", "up", "down"] as const).find((d) => pressed[d]) || null;
    return fallback;
  }

  private dirToVel(dir: AvatarDirection | null): { vx: number; vy: number } {
    if (dir === "left") return { vx: -AVATAR_MOVE_SPEED, vy: 0 };
    if (dir === "right") return { vx: AVATAR_MOVE_SPEED, vy: 0 };
    if (dir === "up") return { vx: 0, vy: -AVATAR_MOVE_SPEED };
    if (dir === "down") return { vx: 0, vy: AVATAR_MOVE_SPEED };
    return { vx: 0, vy: 0 };
  }

  private toIdle(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection) {
    const key = `idle-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toWalk(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection) {
    const key = `walk-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toSit(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection) {
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

  private checkRoomEntrance() {
    if (!this.avatar) return;

    const { sprite } = this.avatar;
    const map = this.mapObj.map;
    if (!map) return;

    const objectLayer = map.getObjectLayer("ObjectLayer-Area");
    if (!objectLayer) {
      console.warn("[GameScene] ObjectLayer-Area not found");
      return;
    }

    let targetRoomId = "lobby";

    for (const obj of objectLayer.objects) {
      const objX = obj.x ?? 0;
      const objY = obj.y ?? 0;
      const objWidth = obj.width ?? 0;
      const objHeight = obj.height ?? 0;

      if (sprite.x >= objX && sprite.x <= objX + objWidth && sprite.y >= objY && sprite.y <= objY + objHeight) {
        const properties = obj.properties as { name: string; value: unknown }[];
        if (!properties) continue;

        const typeProperty = properties.find((p) => p.name === "type");
        if (typeProperty?.value !== "room") continue;

        const idProperty = properties.find((p) => p.name === "id");
        const roomId = idProperty?.value;

        if (roomId && typeof roomId === "string") {
          targetRoomId = roomId;
          if (targetRoomId !== "lobby") break;
        }
      }
    }

    if (targetRoomId !== this.currentRoomId) {
      console.log(`[GameScene] Entering room: ${targetRoomId}`);
      this.currentRoomId = targetRoomId;

      if (isMeetingRoomRange(targetRoomId)) {
        const openRoomSelector = this.game.registry.get("openRoomSelector");
        if (openRoomSelector && typeof openRoomSelector === "function") {
          console.log(`[GameScene] Opening room selector for: ${targetRoomId}`);
          openRoomSelector(targetRoomId);
        } else {
          console.warn("[GameScene] openRoomSelector function not found in registry");
        }
      } else {
        const joinRoom = this.game.registry.get("joinRoom");
        if (joinRoom && typeof joinRoom === "function") {
          console.log(`[GameScene] Calling joinRoom(${targetRoomId})`);
          joinRoom(targetRoomId);
        } else {
          console.warn("[GameScene] joinRoom function not found in registry");
        }
      }
    }
  }

  // Create / Setup helpers (used by create)
  loadAvatar(avatar: Avatar) {
    const spawn = this.getAvatarSpawnPoint();

    const sprite = this.physics.add.sprite(spawn.x, spawn.y, avatar.assetKey, IDLE_FRAME[avatar.direction]);
    sprite.setOrigin(0.5, 0.75);
    sprite.body.setSize(TILE_SIZE - 2, TILE_SIZE - 2);
    sprite.body.setOffset(1, TILE_SIZE + 1);

    this.mapObj.map?.layers.forEach(({ tilemapLayer }) => {
      if (!tilemapLayer) return;
      this.physics.add.collider(sprite, tilemapLayer);
    });

    this.avatar = { sprite, direction: avatar.direction, state: avatar.state };

    // camera 설정
    this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
    this.cameras.main.startFollow(sprite, false, 1, 1);
    this.cameras.main.setRoundPixels(true);

    this.emitPlayerPosition();
  }

  renderAnotherAvatars(users: User[]): void {
    const missingUsers = [...this.avatars.keys()].filter((userId) => !users.find((u) => u.id === userId));
    missingUsers.forEach((userId) => {
      const avatar = this.avatars.get(userId);
      if (avatar) {
        avatar.destroy();
        this.avatars.delete(userId);
      }
    });

    users.sort((a, b) => a.avatar.y - b.avatar.y);

    users.forEach((user, index) => {
      this.renderSingleAnotherAvatar(user, index);
    });
    this.avatar?.sprite.setDepth(this.mapObj.depthCount + users.length);
  }

  private renderSingleAnotherAvatar(user: User, index: number): void {
    const avatarModel = user.avatar;

    let avatar = this.avatars.get(user.id);
    if (avatar) {
      avatar.setPosition(avatarModel.x, avatarModel.y);
    } else {
      avatar = this.add.sprite(avatarModel.x, avatarModel.y, avatarModel.assetKey, IDLE_FRAME[avatarModel.direction]);
      avatar.setOrigin(0.5, 0.75);

      this.avatars.set(user.id, avatar);
    }

    avatar.setDepth(this.mapObj.depthCount + index);

    if (avatarModel.state === "sit") {
      this.toSit(avatar, avatarModel.direction);
    } else if (avatarModel.state === "walk") {
      this.toWalk(avatar, avatarModel.direction);
    } else {
      this.toIdle(avatar, avatarModel.direction);
    }
  }

  private getAvatarSpawnPoint() {
    const map = this.mapObj.map;
    if (!map) throw new Error("Map not loaded");

    const objectLayer = map.getObjectLayer("ObjectLayer-Spawn");

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

  private createAllAvatarAnimations() {
    (Object.keys(AVATAR_ASSETS) as AvatarAssetKey[]).forEach((assetKey) => {
      this.createAvatarAnimations(assetKey);
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

  // WebSocket 관련 메서드
  private emitPlayerPosition() {
    if (!this.socket || !this.avatar) return;

    const currentX = Math.round(this.avatar.sprite.x);
    const currentY = Math.round(this.avatar.sprite.y);

    const now = Date.now();
    if (
      (this.lastEmitted.x === currentX &&
        this.lastEmitted.y === currentY &&
        this.lastEmitted.direction === this.avatar.direction &&
        this.lastEmitted.state === this.avatar.state) ||
      now - this.lastEmitted.time < this.threshold
    ) {
      return;
    }

    this.socket.emit(UserEventType.PLAYER_MOVE, {
      x: currentX,
      y: currentY,
      direction: this.avatar.direction,
      state: this.avatar.state,
    });

    this.lastEmitted = {
      x: currentX,
      y: currentY,
      direction: this.avatar.direction,
      state: this.avatar.state,
      time: now,
    };
  }

  setSocket(socket: Socket) {
    this.socket = socket;
  }
}
