import { IDLE_FRAME, NICKNAME_OFFSET_Y, SIT_FRAME } from "../model/game.constants";
import Phaser from "phaser";

import type { User } from "@shared/types";
import type { AvatarDirection } from "@shared/types";

export class AvatarRenderer {
  private scene: Phaser.Scene;
  private avatars: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private nicknameTexts: Map<string, Phaser.GameObjects.DOMElement> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  renderAnotherAvatars(users: User[], baseDepth: number): void {
    const missingUsers = [...this.avatars.keys()].filter((userId) => !users.find((u) => u.id === userId));
    missingUsers.forEach((userId) => {
      const avatar = this.avatars.get(userId);
      if (avatar) {
        avatar.destroy();
        this.avatars.delete(userId);
      }

      const nicknameText = this.nicknameTexts.get(userId);
      if (nicknameText) {
        nicknameText.destroy();
        this.nicknameTexts.delete(userId);
      }
    });

    users.sort((a, b) => a.avatar.y - b.avatar.y);

    users.forEach((user, index) => {
      this.renderSingleAvatar(user, baseDepth + index);
    });
  }

  private renderSingleAvatar(user: User, depth: number): void {
    const avatarModel = user.avatar;

    let avatar = this.avatars.get(user.id);
    if (avatar) {
      avatar.setPosition(avatarModel.x, avatarModel.y);
    } else {
      avatar = this.scene.add.sprite(
        avatarModel.x,
        avatarModel.y,
        avatarModel.assetKey,
        IDLE_FRAME[avatarModel.direction],
      );
      avatar.setOrigin(0.5, 0.75);
      this.avatars.set(user.id, avatar);
    }

    avatar.setDepth(depth);

    if (avatarModel.state === "sit") {
      this.toSit(avatar, avatarModel.direction);
    } else if (avatarModel.state === "walk") {
      this.toWalk(avatar, avatarModel.direction);
    } else {
      this.toIdle(avatar, avatarModel.direction);
    }

    let nicknameText = this.nicknameTexts.get(user.id);
    if (nicknameText) {
      this.updateNicknamePosition(nicknameText, avatar);
    } else {
      nicknameText = this.createNicknameText(avatarModel.x, avatarModel.y - NICKNAME_OFFSET_Y, user.nickname);
      this.nicknameTexts.set(user.id, nicknameText);
    }

    nicknameText.setDepth(depth);
  }

  private createNicknameText(x: number, y: number, nickname: string): Phaser.GameObjects.DOMElement {
    const div = document.createElement("div");
    div.textContent = nickname;
    div.className =
      "text-[5px] text-white bg-black/66 px-1 py-0.5 rounded whitespace-nowrap pointer-events-none select-none";

    const domElement = this.scene.add.dom(x, y, div);
    domElement.setOrigin(0.5, 1);

    return domElement;
  }

  private updateNicknamePosition(domElement: Phaser.GameObjects.DOMElement, sprite: Phaser.GameObjects.Sprite): void {
    domElement.setPosition(sprite.x, sprite.y - NICKNAME_OFFSET_Y);
  }

  private toIdle(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    const key = `idle-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toWalk(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    const key = `walk-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toSit(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    sprite.anims.stop();
    sprite.setFrame(SIT_FRAME[dir]);
  }

  destroy(): void {
    this.avatars.forEach((avatar) => avatar.destroy());
    this.nicknameTexts.forEach((text) => text.destroy());
    this.avatars.clear();
    this.nicknameTexts.clear();
  }
}
