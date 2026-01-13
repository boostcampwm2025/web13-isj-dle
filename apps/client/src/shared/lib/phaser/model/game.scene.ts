import { GAME_REGISTRY_KEYS, getRegistryFunction } from "./game-registry.constants";
import {
  AVATAR_FRAME_HEIGHT,
  AVATAR_FRAME_WIDTH,
  AVATAR_MOVE_SPEED,
  AVATAR_SNAP_SPEED,
  BOUNDARY_DASH,
  BOUNDARY_OFFSET,
  GAME_SCENE_KEY,
  IDLE_FRAME,
  MAP_NAME,
  SIT_FRAME,
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
  MINIMUM_NUMBER_OF_MEMBERS,
  TILE_SIZE,
  type User,
  UserEventType,
} from "@shared/types";
import { isMeetingRoomRange } from "@src/shared/config/room.config";

export class GameScene extends Phaser.Scene {
  public isReady: boolean = false;
  private mapObj: MapObj;
  private avatar?: AvatarEntity;
  private avatars: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private boundaryGraphics?: Phaser.GameObjects.Graphics;
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

      const joinRoom = getRegistryFunction(this.game, "JOIN_ROOM");
      if (joinRoom) {
        console.log(`[GameScene] Calling joinRoom(${targetRoomId})`);
        joinRoom(targetRoomId);
      } else {
        console.warn(`[GameScene] ${GAME_REGISTRY_KEYS.JOIN_ROOM} function not found in registry`);
      }

      if (isMeetingRoomRange(targetRoomId)) {
        const openRoomSelector = getRegistryFunction(this.game, "OPEN_ROOM_SELECTOR");
        if (openRoomSelector) {
          console.log(`[GameScene] Opening room selector for: ${targetRoomId}`);
          openRoomSelector(targetRoomId);
        } else {
          console.warn(`[GameScene] ${GAME_REGISTRY_KEYS.OPEN_ROOM_SELECTOR} function not found in registry`);
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

  renderAnotherAvatars(users: User[], currentUser?: User | null): void {
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

    this.renderBoundary(users, currentUser);
  }

  private renderBoundary(users: User[], currentUser?: User | null): void {
    // 기존 그래픽 제거
    if (this.boundaryGraphics) {
      this.boundaryGraphics.clear();
    } else {
      this.boundaryGraphics = this.add.graphics();
      this.boundaryGraphics.setDepth(this.mapObj.depthCount - 1);
    }

    if (currentUser?.avatar.currentRoomId !== "lobby") return;
    const contactGroups = new Map<string, Array<{ x: number; y: number }>>();

    for (const user of users) {
      if (!user.contactId || user.avatar.currentRoomId !== "lobby" || user.avatar.state !== "idle") continue;

      let group = contactGroups.get(user.contactId);
      if (!group) {
        group = [];
        contactGroups.set(user.contactId, group);
      }

      group.push({ x: user.avatar.x, y: user.avatar.y });
    }

    if (currentUser?.contactId && this.avatar?.state === "idle") {
      let group = contactGroups.get(currentUser.contactId);
      if (!group) {
        group = [];
        contactGroups.set(currentUser.contactId, group);
      }

      group.push({ x: this.avatar.sprite.x, y: this.avatar.sprite.y });
    }

    // 각 그룹별로 바운더리 그리기
    for (const [, points] of contactGroups) {
      if (points.length < MINIMUM_NUMBER_OF_MEMBERS) continue;

      const hull = this.computeConvexHull(points);
      this.drawDashedHull(hull, BOUNDARY_OFFSET);
    }
  }

  // Convex Hull 계산 (Graham Scan)
  private computeConvexHull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
    if (points.length <= MINIMUM_NUMBER_OF_MEMBERS) return points;

    // 가장 아래쪽(y가 큰) 점 찾기, 같으면 왼쪽(x가 작은) 점
    let start = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y > points[start].y || (points[i].y === points[start].y && points[i].x < points[start].x)) {
        start = i;
      }
    }

    const pivot = points[start];

    // 각도 기준으로 정렬
    const sorted = points
      .filter((_, i) => i !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
        const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
        if (angleA !== angleB) return angleA - angleB;
        // 같은 각도면 거리 순
        const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2;
        const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2;
        return distA - distB;
      });

    const hull: Array<{ x: number; y: number }> = [pivot];

    for (const point of sorted) {
      while (hull.length > 1 && this.cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }

    return hull;
  }

  // 외적 계산 (방향 판단용)
  private cross(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  // Convex Hull을 패딩 적용하여 점선으로 그리기
  private drawDashedHull(hull: Array<{ x: number; y: number }>, padding: number): void {
    if (!this.boundaryGraphics || hull.length < MINIMUM_NUMBER_OF_MEMBERS) return;

    this.boundaryGraphics.lineStyle(1, 0x00ff00, 0.8);
    this.drawDashedRoundedPolygon(hull, padding);
  }

  private drawDashedRoundedPolygon(hull: Array<{ x: number; y: number }>, padding: number): void {
    if (!this.boundaryGraphics || hull.length < MINIMUM_NUMBER_OF_MEMBERS) return;

    // hull 방향 계산 (시계 / 반시계)
    let signedArea = 0;
    for (let i = 0; i < hull.length; i++) {
      const curr = hull[i];
      const next = hull[(i + 1) % hull.length];
      signedArea += (next.x - curr.x) * (next.y + curr.y);
    }
    const clockwise = signedArea > 0;

    let isDrawing = true;
    let dashRemaining = 4;

    for (let i = 0; i < hull.length; i++) {
      const curr = hull[i];
      const next = hull[(i + 1) % hull.length];
      const prev = hull[(i - 1 + hull.length) % hull.length];

      // 현재 edge 방향
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;

      // 외부 법선
      const sign = clockwise ? -1 : 1;
      const nx = (sign * dy) / len;
      const ny = (-sign * dx) / len;

      const startX = curr.x + nx * padding;
      const startY = curr.y + ny * padding;
      const endX = next.x + nx * padding;
      const endY = next.y + ny * padding;

      // 코너용 이전 edge 법선
      const pdx = curr.x - prev.x;
      const pdy = curr.y - prev.y;
      const plen = Math.hypot(pdx, pdy);

      if (plen > 0) {
        const pnx = (sign * pdy) / plen;
        const pny = (-sign * pdx) / plen;

        const prevX = curr.x + pnx * padding;
        const prevY = curr.y + pny * padding;

        const startAngle = Math.atan2(prevY - curr.y, prevX - curr.x);
        const endAngle = Math.atan2(startY - curr.y, startX - curr.x);

        const arcResult = this.drawDashedArc(curr.x, curr.y, padding, startAngle, endAngle, dashRemaining, isDrawing);
        dashRemaining = arcResult.dashRemaining;
        isDrawing = arcResult.isDrawing;
      }

      const lineResult = this.drawDashedLine(startX, startY, endX, endY, dashRemaining, isDrawing);
      dashRemaining = lineResult.dashRemaining;
      isDrawing = lineResult.isDrawing;
    }
  }

  // 점선 직선 그리기
  private drawDashedLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dashRemaining: number,
    isDrawing: boolean,
  ): { dashRemaining: number; isDrawing: boolean } {
    if (!this.boundaryGraphics) return { dashRemaining, isDrawing };

    const dashLength = BOUNDARY_DASH.LENGTH;
    const gapLength = BOUNDARY_DASH.GAP;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { dashRemaining, isDrawing };

    const unitX = dx / distance;
    const unitY = dy / distance;

    let traveled = 0;
    let cx = x1;
    let cy = y1;

    while (traveled < distance) {
      const segLen = Math.min(dashRemaining, distance - traveled);

      if (isDrawing) {
        this.boundaryGraphics.beginPath();
        this.boundaryGraphics.moveTo(cx, cy);
        this.boundaryGraphics.lineTo(cx + unitX * segLen, cy + unitY * segLen);
        this.boundaryGraphics.strokePath();
      }

      cx += unitX * segLen;
      cy += unitY * segLen;
      traveled += segLen;
      dashRemaining -= segLen;

      if (dashRemaining <= 0) {
        isDrawing = !isDrawing;
        dashRemaining = isDrawing ? dashLength : gapLength;
      }
    }

    return { dashRemaining, isDrawing };
  }

  // 점선 호 그리기
  private drawDashedArc(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    dashRemaining: number,
    isDrawing: boolean,
  ): { dashRemaining: number; isDrawing: boolean } {
    if (!this.boundaryGraphics) return { dashRemaining, isDrawing };

    const dashLength = BOUNDARY_DASH.LENGTH;
    const gapLength = BOUNDARY_DASH.GAP;

    // 각도 정규화
    while (endAngle < startAngle) endAngle += 2 * Math.PI;
    const totalAngle = endAngle - startAngle;
    const arcLength = totalAngle * radius;
    const segments = Math.max(8, Math.ceil(arcLength / 4));

    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (i / segments) * totalAngle;
      const a2 = startAngle + ((i + 1) / segments) * totalAngle;

      const x1 = cx + Math.cos(a1) * radius;
      const y1 = cy + Math.sin(a1) * radius;
      const x2 = cx + Math.cos(a2) * radius;
      const y2 = cy + Math.sin(a2) * radius;

      const segLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

      if (isDrawing) {
        this.boundaryGraphics.beginPath();
        this.boundaryGraphics.moveTo(x1, y1);
        this.boundaryGraphics.lineTo(x2, y2);
        this.boundaryGraphics.strokePath();
      }

      dashRemaining -= segLen;
      if (dashRemaining <= 0) {
        isDrawing = !isDrawing;
        dashRemaining = isDrawing ? dashLength : gapLength;
      }
    }

    return { dashRemaining, isDrawing };
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
