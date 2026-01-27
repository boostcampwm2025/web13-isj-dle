import type { GameScene } from "../core";
import { AUTO_MOVE_DURATION } from "../model/game.constants";
import type { TilePoint } from "../model/game.types";
import { getDirBetween, tileToWorld, worldToTile } from "../utils";
import EasyStar from "easystarjs";

import type { AvatarDirection } from "@shared/types";

const BLOCKED: TilePoint[] = [
  { x: 51, y: 63 },
  { x: 51, y: 64 },
  { x: 64, y: 63 },
  { x: 64, y: 64 },
  { x: 77, y: 63 },
  { x: 77, y: 64 },

  { x: 51, y: 75 },
  { x: 51, y: 76 },
  { x: 64, y: 75 },
  { x: 64, y: 76 },
  { x: 77, y: 75 },
  { x: 77, y: 76 },
];

export class AutoMoveManager {
  private scene: GameScene;
  private navGrid: number[][] | null = null;
  private autoMoveTween?: Phaser.Tweens.Tween;
  private lastTargetTile?: TilePoint;
  easystar = new EasyStar.js();
  isAutoMoving = false;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  movePlayer({ x, y, direction }: { x: number; y: number; direction: AvatarDirection }): void {
    if (!this.scene.avatarEntity) return;
    if (!this.navGrid) return;

    const from = worldToTile(this.scene.avatarEntity.sprite.x, this.scene.avatarEntity.sprite.y);
    const to = worldToTile(x, y);

    if (this.isAutoMoving && this.lastTargetTile && this.lastTargetTile.x === to.x && this.lastTargetTile.y === to.y) {
      return;
    }

    this.lastTargetTile = to;

    if (this.isAutoMoving) {
      this.cancelAutoMove();
    }

    this.easystar.findPath(from.x, from.y, to.x, to.y, (path) => {
      if (!path || path.length === 0) return;

      this.followPath(path, direction);
    });
  }

  setupPathFinding() {
    const map = this.scene.mapInfo.map;
    if (!map) return;

    const grid: number[][] = Array.from({ length: map.height }, () => Array(map.width).fill(0));

    map.layers.forEach(({ name, tilemapLayer }) => {
      if (!tilemapLayer) return;
      if (!name.includes("Collision")) return;

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const t = tilemapLayer.getTileAt(x, y);
          if (!t) continue;

          const collides = t.properties?.collides === true;
          if (collides || t.index !== -1) grid[y][x] = 1;
        }
      }
    });

    for (const point of BLOCKED) {
      if (point.y < 0 || point.y >= grid.length) continue;
      if (point.x < 0 || point.x >= grid[0].length) continue;
      grid[point.y][point.x] = 1;
    }

    this.navGrid = grid;
    this.easystar.setGrid(grid);
    this.easystar.setAcceptableTiles([0]);
    this.easystar.setIterationsPerCalculation(4000);
  }

  private followPath(path: { x: number; y: number }[], finalDirection: AvatarDirection) {
    if (!this.scene.avatarEntity) return;
    if (path.length <= 1) return;

    this.isAutoMoving = true;

    const steps = path.slice(1);
    let i = 0;

    const moveNext = () => {
      if (!this.scene.avatarEntity) return;

      if (i >= steps.length) {
        this.isAutoMoving = false;
        this.lastTargetTile = undefined;

        this.scene.avatarEntity.direction = finalDirection;

        this.scene.avatarEntity.sprite.setVelocity(0, 0);
        return;
      }

      const prev = i === 0 ? path[0] : steps[i - 1];
      const next = steps[i];
      const dir = getDirBetween(prev, next);

      this.scene.avatarEntity.direction = dir;
      this.scene.avatarEntity.state = "walk";
      this.scene.animation.toWalk(this.scene.avatarEntity.sprite, dir);

      const { x, y } = tileToWorld(next.x, next.y);
      i++;

      this.autoMoveTween?.stop();

      this.autoMoveTween = this.scene.tweens.add({
        targets: this.scene.avatarEntity.sprite,
        x,
        y,
        duration: AUTO_MOVE_DURATION,
        ease: "Linear",
        onUpdate: () => {
          this.scene.avatarEntity?.sprite.setVelocity(0, 0);
        },
        onComplete: moveNext,
      });
    };

    moveNext();
  }

  private cancelAutoMove() {
    this.autoMoveTween?.stop();
    this.autoMoveTween = undefined;

    this.isAutoMoving = false;

    if (this.scene.avatarEntity) {
      this.scene.avatarEntity.sprite.setVelocity(0, 0);
      this.scene.avatarEntity.state = "idle";
      this.scene.animation.toIdle(this.scene.avatarEntity.sprite, this.scene.avatarEntity.direction);
    }
  }

  cancelByUser() {
    if (!this.isAutoMoving) return;
    this.cancelAutoMove();
    this.lastTargetTile = undefined;
  }
}
