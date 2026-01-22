import { AvatarAnimationManager, InputManager, NetworkSyncManager, RoomEntranceManager } from "../managers";
import {
  AVATAR_FRAME_HEIGHT,
  AVATAR_FRAME_WIDTH,
  AVATAR_SNAP_SPEED,
  GAME_SCENE_KEY,
  IDLE_FRAME,
  MAP_NAME,
  NICKNAME_OFFSET_Y,
  TMJ_URL,
} from "../model/game.constants";
import type { AvatarEntity, MapObj } from "../model/game.types";
import { AvatarRenderer, BoundaryRenderer } from "../renderers";
import { getAvatarSpawnPoint, getSeatDirectionAtPosition, getSeatPoints, loadTilesets } from "../utils";
import Phaser from "phaser";
import type { Socket } from "socket.io-client";

import { LecternManager } from "@features/game/managers/lectern.manager.ts";
import {
  AVATAR_ASSETS,
  type AvatarAssetKey,
  type AvatarDirection,
  type AvatarState,
  type DeskStatus,
  TILE_SIZE,
  type User,
  UserEventType,
} from "@shared/types";

export class GameScene extends Phaser.Scene {
  public isReady: boolean = false;

  private mapObj: MapObj;
  private avatar?: AvatarEntity;
  private avatarNickname?: Phaser.GameObjects.DOMElement;

  private inputManager!: InputManager;
  private animationManager!: AvatarAnimationManager;
  private roomEntranceManager!: RoomEntranceManager;
  private networkSyncManager!: NetworkSyncManager;
  private avatarRenderer!: AvatarRenderer;
  private boundaryRenderer!: BoundaryRenderer;
  private lecternManager!: LecternManager;

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
    return this.networkSyncManager?.isInitialized() ?? false;
  }

  get deskSeatPoints() {
    return getSeatPoints(this.mapObj.map, "DeskZone");
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
      await loadTilesets(this, this.mapObj.tmjUrl);

      const map = this.make.tilemap({ key: this.mapObj.name });
      this.mapObj.map = map;

      map.tilesets.map((ts) => map.addTilesetImage(ts.name));

      map.layers.forEach(({ name }) => {
        const layer = map.createLayer(name, map.tilesets);
        if (!layer) throw new Error(`Layer ${name} could not be created.`);

        layer.setDepth(this.mapObj.depthCount++);
        if (name.includes("Collision")) {
          layer.setCollisionByProperty({ collides: true });
        }
      });

      this.lecternManager = new LecternManager(this, map);

      this.input.on(
        "wheel",
        (_pointer: Phaser.Input.Pointer, _objs: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
          if (dy == 0) return;
          if (dy > 0) this.mapObj.zoom.index = Math.max(0, this.mapObj.zoom.index - 1);
          else this.mapObj.zoom.index = Math.min(this.mapObj.zoom.levels.length - 1, this.mapObj.zoom.index + 1);

          this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
        },
      );

      this.initializeModules();

      this.isReady = true;
      this.events.emit("scene:ready");
    } catch (error) {
      console.error("Error loading tilesets:", error);
    }
  }

  private initializeModules(): void {
    this.inputManager = new InputManager(this);
    this.inputManager.initialize();

    this.animationManager = new AvatarAnimationManager(this);
    this.animationManager.createAllAvatarAnimations();

    this.networkSyncManager = new NetworkSyncManager();
    this.networkSyncManager.setOnDeskStatusChange((status) => {
      this.updateMyNicknameIndicator(status);
    });

    this.roomEntranceManager = new RoomEntranceManager(this, this.mapObj.map);
    this.roomEntranceManager.setNetworkSyncManager(this.networkSyncManager);

    this.avatarRenderer = new AvatarRenderer(this);

    this.boundaryRenderer = new BoundaryRenderer(this);
    this.boundaryRenderer.initialize(this.mapObj.depthCount - 1);
  }

  update() {
    if (!this.avatar) return;

    this.networkSyncManager.emitPlayerPosition(
      this.avatar.sprite.x,
      this.avatar.sprite.y,
      this.avatar.direction,
      this.avatar.state,
      UserEventType.PLAYER_MOVE,
    );

    if (this.avatarNickname) {
      this.avatarNickname.setPosition(this.avatar.sprite.x, this.avatar.sprite.y - NICKNAME_OFFSET_Y);
    }

    const inputDirection = this.inputManager.getNextDirection();

    this.roomEntranceManager.checkRoomEntrance(this.avatar.sprite.x, this.avatar.sprite.y);
    this.lecternManager.checkLectern(
      this.avatar.sprite.x,
      this.avatar.sprite.y,
      this.roomEntranceManager.getCurrentRoomId(),
    );

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
      this.avatar.state = "walk";
      this.avatar.direction = inputDirection;
      this.animationManager.toWalk(this.avatar.sprite, inputDirection);
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

    this.mapObj.map?.layers.forEach(({ tilemapLayer }) => {
      if (!tilemapLayer) return;
      this.physics.add.collider(sprite, tilemapLayer);
    });

    this.avatar = { sprite, direction: avatar.direction, state: avatar.state };

    this.avatarNickname = this.createNicknameText(spawn.x, spawn.y - NICKNAME_OFFSET_Y, user.nickname);
    this.avatarNickname.setDepth(Number.MAX_SAFE_INTEGER);

    this.cameras.main.setZoom(this.mapObj.zoom.levels[this.mapObj.zoom.index]);
    this.cameras.main.startFollow(sprite, false, 1, 1);
    this.cameras.main.setRoundPixels(true);
  }

  renderAnotherAvatars(users: User[], currentUser?: User | null): void {
    this.avatarRenderer.renderAnotherAvatars(users, this.mapObj.depthCount);
    this.avatar?.sprite.setDepth(this.mapObj.depthCount + users.length);

    this.boundaryRenderer.render(
      users,
      currentUser,
      this.avatar ? { x: this.avatar.sprite.x, y: this.avatar.sprite.y } : undefined,
    );
  }

  private createNicknameText(
    x: number,
    y: number,
    nickname: string,
    deskStatus?: DeskStatus | null,
  ): Phaser.GameObjects.DOMElement {
    const div = document.createElement("div");
    div.className =
      "flex items-center text-[4px] leading-none text-white bg-black/70 px-[3px] py-[2px] rounded whitespace-nowrap pointer-events-none select-none";

    if (deskStatus) {
      const indicator = document.createElement("span");
      indicator.className = "status-indicator inline-block w-[3px] h-[3px] rounded-full shrink-0";
      indicator.style.backgroundColor = this.getDeskStatusColor(deskStatus);
      div.appendChild(indicator);
    }

    const text = document.createElement("span");
    text.className = "ml-[1px]";

    text.textContent = nickname;
    div.appendChild(text);

    const domElement = this.add.dom(x, y, div);
    domElement.setOrigin(0.5, 1);

    return domElement;
  }

  private getDeskStatusColor(status: DeskStatus): string {
    const colors: Record<DeskStatus, string> = {
      available: "#10b981",
      focusing: "#f43f5e",
      talking: "#f59e0b",
    };
    return colors[status];
  }

  updateMyNicknameIndicator(deskStatus: DeskStatus | null): void {
    if (!this.avatarNickname) return;

    const div = this.avatarNickname.node as HTMLDivElement;
    let indicator = div.querySelector(".status-indicator") as HTMLSpanElement | null;

    if (deskStatus) {
      if (!indicator) {
        indicator = document.createElement("span");
        indicator.className = "status-indicator inline-block w-[3px] h-[3px] rounded-full shrink-0";
        div.insertBefore(indicator, div.firstChild);
      }
      indicator.style.backgroundColor = this.getDeskStatusColor(deskStatus);
    } else if (indicator) {
      indicator.remove();
    }
  }

  setSocket(socket: Socket): void {
    this.networkSyncManager.setSocket(socket);
  }

  setInputEnabled(enabled: boolean): void {
    this.inputManager?.setEnabled(enabled);
  }
}
