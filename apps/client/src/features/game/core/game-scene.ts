import {
  AVATAR_ASSETS,
  type AvatarAssetKey,
  type AvatarDirection,
  type AvatarState,
  TILE_SIZE,
  type User,
  UserEventType,
} from "@shared/types";

import {
  AutoMoveManager,
  AvatarAnimationManager,
  InputManager,
  LecternManager,
  NetworkSyncManager,
  NicknameManager,
  RestaurantImageManager,
  RoomEntranceManager,
} from "../managers";
import {
  AVATAR_FRAME_HEIGHT,
  AVATAR_FRAME_WIDTH,
  AVATAR_SNAP_SPEED,
  GAME_SCENE_KEY,
  IDLE_FRAME,
  MAP_NAME,
  TMJ_URL,
} from "../model/game.constants";
import type { AvatarEntity, MapObj } from "../model/game.types";
import { DEFAULT_ZOOM_INDEX, ZOOM_LEVELS } from "../model/zoom.constants";
import { useZoomStore } from "../model/zoom.store";
import { AvatarRenderer, BoundaryRenderer } from "../renderers";
import { getAvatarSpawnPoint, getSeatDirectionAtPosition, getSeatPoints } from "../utils";
import Phaser from "phaser";
import type { Socket } from "socket.io-client";

export class GameScene extends Phaser.Scene {
  public isReady: boolean = false;

  private mapObj: MapObj;
  private avatar?: AvatarEntity;
  private user!: User;
  private nicknameManager!: NicknameManager;

  private inputManager!: InputManager;
  private animationManager!: AvatarAnimationManager;
  private roomEntranceManager!: RoomEntranceManager;
  private networkSyncManager!: NetworkSyncManager;
  private avatarRenderer!: AvatarRenderer;
  private boundaryRenderer!: BoundaryRenderer;
  private lecternManager!: LecternManager;
  private restaurantImageManager!: RestaurantImageManager;
  private autoMoveManager!: AutoMoveManager;
  private lastZoomTime = 0;
  private readonly ZOOM_THROTTLE_MS = 50;

  constructor() {
    super({ key: GAME_SCENE_KEY });
    this.mapObj = {
      tmjUrl: TMJ_URL,
      name: MAP_NAME,
      map: null,
      depthCount: 0,
      zoom: {
        index: DEFAULT_ZOOM_INDEX,
        levels: [...ZOOM_LEVELS],
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
    return this.networkSyncManager?.isInitialized() ?? false;
  }

  get deskSeatPoints() {
    return getSeatPoints(this.mapObj.map, "DeskZone");
  }

  get nickname(): NicknameManager {
    return this.nicknameManager;
  }

  get avatarEntity(): AvatarEntity | undefined {
    return this.avatar;
  }

  get animation(): AvatarAnimationManager {
    return this.animationManager;
  }

  get autoMove(): AutoMoveManager {
    return this.autoMoveManager;
  }

  movePlayer(x: number, y: number, direction: AvatarDirection, state: AvatarState): void {
    if (!this.avatar) return;
    this.avatar.direction = direction;
    this.avatar.state = state;
    this.avatar.sprite.setPosition(x, y);
    this.animationManager.toSit(this.avatar.sprite, direction);
  }

  preload() {
    this.load.tilemapTiledJSON(this.mapObj.name, this.mapObj.tmjUrl);

    this.load.once(`filecomplete-tilemapJSON-${this.mapObj.name}`, () => {
      const cached = this.cache.tilemap.get(this.mapObj.name);
      if (!cached?.data?.tilesets) return;

      for (const ts of cached.data.tilesets) {
        if (!ts.image) continue;
        const base = new URL(this.mapObj.tmjUrl, window.location.origin);
        this.load.image(ts.name, new URL(ts.image, base).pathname);
      }
    });

    (Object.keys(AVATAR_ASSETS) as AvatarAssetKey[]).forEach((assetKey) => {
      const { url } = AVATAR_ASSETS[assetKey];

      this.load.spritesheet(assetKey, url, {
        frameWidth: AVATAR_FRAME_WIDTH,
        frameHeight: AVATAR_FRAME_HEIGHT,
      });
    });
  }

  create() {
    try {
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

      this.lecternManager = new LecternManager(this, map);

      this.input.on(
        "wheel",
        (_pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
          if (dy === 0) return;

          const now = Date.now();
          if (now - this.lastZoomTime < this.ZOOM_THROTTLE_MS) return;
          this.lastZoomTime = now;

          if (dy > 0) {
            useZoomStore.getState().zoomOut();
          } else {
            useZoomStore.getState().zoomIn();
          }
          this.syncZoomFromStore();
        },
      );

      this.initializeModules();

      this.isReady = true;
      this.events.emit("scene:ready");
    } catch (error) {
      console.error("Error loading Phaser:", error);
    }
  }

  private initializeModules(): void {
    this.inputManager = new InputManager(this);
    this.inputManager.initialize();

    this.animationManager = new AvatarAnimationManager(this);
    this.animationManager.createAllAvatarAnimations();

    this.networkSyncManager = new NetworkSyncManager();
    this.networkSyncManager.setOnDeskStatusChange((status) => {
      this.nicknameManager.updateIndicator(status);
    });

    this.roomEntranceManager = new RoomEntranceManager(this, this.mapObj.map);
    this.roomEntranceManager.setNetworkSyncManager(this.networkSyncManager);

    this.avatarRenderer = new AvatarRenderer(this);

    this.boundaryRenderer = new BoundaryRenderer(this);
    this.boundaryRenderer.initialize(this.mapObj.depthCount - 1);
    this.nicknameManager = new NicknameManager(this);
    this.restaurantImageManager = new RestaurantImageManager(this);

    this.autoMoveManager = new AutoMoveManager(this);
    this.autoMoveManager.setupPathFinding();
  }

  update() {
    if (!this.avatar) return;

    if (this.autoMoveManager.target) this.autoMoveManager.calculate();

    this.networkSyncManager.emitPlayerPosition(
      this.avatar.sprite.x,
      this.avatar.sprite.y,
      this.avatar.direction,
      this.avatar.state,
      UserEventType.PLAYER_MOVE,
    );

    this.nicknameManager.updatePosition(this.avatar.sprite.x, this.avatar.sprite.y);

    this.roomEntranceManager.checkRoomEntrance(this.avatar.sprite.x, this.avatar.sprite.y);
    this.restaurantImageManager.update({
      currentRoomId: this.roomEntranceManager.getCurrentRoomId(),
      userId: this.user.userId,
      x: this.avatar.sprite.x,
      y: this.avatar.sprite.y,
    });
    this.lecternManager.checkLectern(
      this.avatar.sprite.x,
      this.avatar.sprite.y,
      this.roomEntranceManager.getCurrentRoomId(),
    );

    const inputDirection = this.inputManager.getNextDirection();

    if (this.autoMoveManager.isMoving) {
      if (!inputDirection) return;
      this.autoMoveManager.cancelByUser();
    }

    if (this.avatar.state === "sit") {
      const x = this.avatar.sprite.x;
      const y = this.avatar.sprite.y;
      const tileX = Math.floor(Math.round(x) / TILE_SIZE);
      const tileY = Math.floor(Math.round(y) / TILE_SIZE);
      const targetX = tileX * TILE_SIZE + TILE_SIZE / 2;
      const targetY = tileY * TILE_SIZE + TILE_SIZE / 2;

      const dx = Math.abs(x - targetX);
      const dy = Math.abs(y - targetY);

      if (dx > 0.5 || dy > 0.5) {
        this.avatar.sprite.setPosition(
          Phaser.Math.Linear(x, targetX, AVATAR_SNAP_SPEED),
          Phaser.Math.Linear(y, targetY, AVATAR_SNAP_SPEED),
        );
        return;
      } else if (dx > 0 || dy > 0) {
        this.avatar.sprite.setPosition(targetX, targetY);
      }

      if (!inputDirection) return;
    }

    if (this.inputManager.isSitKeyPressed()) {
      const seatDirection = getSeatDirectionAtPosition(this.mapObj.map, this.avatar.sprite.x, this.avatar.sprite.y);
      if (seatDirection) {
        this.avatar.state = "sit";
        this.avatar.direction = seatDirection;
        this.avatar.sprite.setVelocity(0, 0);
        this.animationManager.toSit(this.avatar.sprite, seatDirection);
        return;
      }
    }

    if (inputDirection) {
      this.avatar.state = this.inputManager.isShiftKeyPressed() ? "run" : "walk";
      this.avatar.direction = inputDirection;
      if (this.avatar.state === "run") {
        this.animationManager.toRun(this.avatar.sprite, inputDirection);
      } else {
        this.animationManager.toWalk(this.avatar.sprite, inputDirection);
      }
    } else {
      this.avatar.state = "idle";
      this.animationManager.toIdle(this.avatar.sprite, this.avatar.direction);
    }

    const { vx, vy } = this.inputManager.dirToVel(inputDirection);
    this.avatar.sprite.setVelocity(vx, vy);

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

  loadAvatar(user: User): void {
    if (this.avatar) return;
    const avatar = user.avatar;
    const spawn = getAvatarSpawnPoint(this.mapObj.map);

    const sprite = this.physics.add.sprite(spawn.x, spawn.y, avatar.assetKey, IDLE_FRAME[avatar.direction]);
    sprite.setOrigin(0.5, 0.75);
    sprite.body.setSize(TILE_SIZE - 2, TILE_SIZE - 2);
    sprite.body.setOffset(1, TILE_SIZE + 1);

    this.mapObj.map?.layers.forEach(({ name, tilemapLayer }) => {
      if (!tilemapLayer || !name.includes("Collision")) return;
      this.physics.add.collider(sprite, tilemapLayer);
    });

    this.avatar = { sprite, direction: avatar.direction, state: avatar.state };
    this.user = user;
    this.nicknameManager.createNickname(spawn.x, spawn.y, user.nickname, user.deskStatus);
    this.nicknameManager.setDepth(Number.MAX_SAFE_INTEGER);

    this.syncZoomFromStore();
    this.cameras.main.startFollow(sprite, false, 1, 1);
    this.cameras.main.setRoundPixels(true);
  }

  updateAvatar(user: User): void {
    if (!this.avatar) return;
    this.nicknameManager.updateNickname(user.nickname, user.avatar.x, user.avatar.y);
    if (this.avatar.sprite.texture.key !== user.avatar.assetKey) {
      this.avatar.sprite.setTexture(user.avatar.assetKey, IDLE_FRAME[this.avatar.direction]);
    }
  }

  syncZoomFromStore(): void {
    const zoomStore = useZoomStore.getState();
    this.mapObj.zoom.index = zoomStore.zoomIndex;
    this.cameras.main.setZoom(zoomStore.getZoomLevel());
  }

  renderAnotherAvatars(users: User[], currentUser?: User | null): void {
    this.avatarRenderer.renderAnotherAvatars(users, this.mapObj.depthCount, currentUser?.socketId ?? null);
    this.avatar?.sprite.setDepth(this.mapObj.depthCount + users.length);

    this.boundaryRenderer.render(
      users,
      currentUser,
      this.avatar ? { x: this.avatar.sprite.x, y: this.avatar.sprite.y } : undefined,
    );
  }

  setSocket(socket: Socket): void {
    this.networkSyncManager.setSocket(socket);
  }

  setInputEnabled(enabled: boolean): void {
    this.inputManager?.setEnabled(enabled);
  }
}
