import type { AvatarDirection } from "@shared/types";

import { AVATAR_RUN_SPEED, AVATAR_WALK_SPEED } from "../model/game.constants";
import type { MoveKeys } from "../model/game.types";
import Phaser from "phaser";

export class InputManager {
  private scene: Phaser.Scene;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: MoveKeys;
  private lastDir: AvatarDirection = "down";

  private _enabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setEnabled(enabled: boolean): void {
    this._enabled = enabled;

    if (this.scene.input.keyboard) {
      if (enabled) {
        this.scene.input.keyboard.enableGlobalCapture();
      } else {
        this.scene.input.keyboard.disableGlobalCapture();
      }
    }

    if (this.keys) {
      this.keys.up.enabled = enabled;
      this.keys.down.enabled = enabled;
      this.keys.left.enabled = enabled;
      this.keys.right.enabled = enabled;
      this.keys.sit.enabled = enabled;
      this.keys.shift.enabled = enabled;
    }

    if (this.cursors) {
      this.cursors.up.enabled = enabled;
      this.cursors.down.enabled = enabled;
      this.cursors.left.enabled = enabled;
      this.cursors.right.enabled = enabled;
    }
  }

  get enabled(): boolean {
    return this._enabled;
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
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    }) as MoveKeys;

    keyboard.on("keydown", (e: KeyboardEvent) => {
      if (!this._enabled) return;

      const k = e.code;

      if (k === "ArrowLeft" || k === "KeyA") this.lastDir = "left";
      else if (k === "ArrowRight" || k === "KeyD") this.lastDir = "right";
      else if (k === "ArrowUp" || k === "KeyW") this.lastDir = "up";
      else if (k === "ArrowDown" || k === "KeyS") this.lastDir = "down";
    });
  }

  getNextDirection(): AvatarDirection | null {
    if (!this._enabled) return null;
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
    const speed = this.isShiftKeyPressed() ? AVATAR_RUN_SPEED : AVATAR_WALK_SPEED;
    if (dir === "left") return { vx: -speed, vy: 0 };
    if (dir === "right") return { vx: speed, vy: 0 };
    if (dir === "up") return { vx: 0, vy: -speed };
    if (dir === "down") return { vx: 0, vy: speed };
    return { vx: 0, vy: 0 };
  }

  isShiftKeyPressed(): boolean {
    if (!this._enabled) return false;
    return this.keys?.shift.isDown ?? false;
  }

  isSitKeyPressed(): boolean {
    if (!this._enabled) return false;
    return this.keys?.sit.isDown ?? false;
  }

  getLastDirection(): AvatarDirection {
    return this.lastDir;
  }
}
