import { AVATAR_ASSETS, type AvatarAssetKey, type AvatarDirection } from "@shared/types";

import { IDLE_FRAME, MOVE_FRAME, SIT_FRAME } from "../model/game.constants";
import Phaser from "phaser";

export class AvatarAnimationManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createAllAvatarAnimations(): void {
    (Object.keys(AVATAR_ASSETS) as AvatarAssetKey[]).forEach((assetKey) => {
      this.createAvatarAnimations(assetKey);
    });
  }

  private createAvatarAnimations(assetKey: AvatarAssetKey): void {
    const directions: AvatarDirection[] = ["down", "left", "right", "up"];

    directions.forEach((dir) => {
      this.scene.anims.create({
        key: `walk-${assetKey}-${dir}`,
        frames: MOVE_FRAME[dir].map((frame) => ({
          key: assetKey,
          frame,
        })),
        frameRate: 10,
        repeat: -1,
      });
      this.scene.anims.create({
        key: `run-${assetKey}-${dir}`,
        frames: MOVE_FRAME[dir].map((frame) => ({
          key: assetKey,
          frame,
        })),
        frameRate: 20,
        repeat: -1,
      });
      this.scene.anims.create({
        key: `idle-${assetKey}-${dir}`,
        frames: [{ key: assetKey, frame: IDLE_FRAME[dir] }],
        frameRate: 1,
        repeat: -1,
      });
    });
  }

  toIdle(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    const key = `idle-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  toWalk(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    const key = `walk-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  toRun(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    const key = `run-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  toSit(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    sprite.anims.stop();
    sprite.setFrame(SIT_FRAME[dir]);
  }
}
