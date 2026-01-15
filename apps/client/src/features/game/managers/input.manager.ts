import { AVATAR_MOVE_SPEED } from "../model/game.constants";
import type { MoveKeys } from "../model/game.types";
import Phaser from "phaser";

import type { AvatarDirection } from "@shared/types";

export class InputManager {
  private scene: Phaser.Scene;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: MoveKeys;
  private lastDir: AvatarDirection = "down";

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  initialize(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();

    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sit: Phaser.Input.Keyboard.KeyCodes.E,
    }) as MoveKeys;

    keyboard.on("keydown", (e: KeyboardEvent) => {
      const k = e.code;

      if (k === "ArrowLeft" || k === "KeyA") this.lastDir = "left";
      else if (k === "ArrowRight" || k === "KeyD") this.lastDir = "right";
      else if (k === "ArrowUp" || k === "KeyW") this.lastDir = "up";
      else if (k === "ArrowDown" || k === "KeyS") this.lastDir = "down";
    });
  }

  getNextDirection(): AvatarDirection | null {
    if (!this.cursors || !this.keys) return null;

    const down = this.cursors.down.isDown || this.keys.down.isDown;
    const up = this.cursors.up.isDown || this.keys.up.isDown;
    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;

    const pressed: Record<AvatarDirection, boolean> = { up, down, left, right };

    if (pressed[this.lastDir]) {
      return this.lastDir;
    }

    const fallback = (["left", "right", "up", "down"] as const).find((d) => pressed[d]) || null;
    return fallback;
  }

  dirToVel(dir: AvatarDirection | null): { vx: number; vy: number } {
    if (dir === "left") return { vx: -AVATAR_MOVE_SPEED, vy: 0 };
    if (dir === "right") return { vx: AVATAR_MOVE_SPEED, vy: 0 };
    if (dir === "up") return { vx: 0, vy: -AVATAR_MOVE_SPEED };
    if (dir === "down") return { vx: 0, vy: AVATAR_MOVE_SPEED };
    return { vx: 0, vy: 0 };
  }

  isSitKeyPressed(): boolean {
    return this.keys?.sit.isDown ?? false;
  }

  getLastDirection(): AvatarDirection {
    return this.lastDir;
  }
}
