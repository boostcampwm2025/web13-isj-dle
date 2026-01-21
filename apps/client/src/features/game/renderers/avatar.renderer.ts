import { IDLE_FRAME, NICKNAME_OFFSET_Y, SIT_FRAME } from "../model/game.constants";
import Phaser from "phaser";

import type { AvatarDirection, DeskStatus, User } from "@shared/types";

const DESK_STATUS_INDICATOR_COLORS: Record<DeskStatus, string> = {
  available: "#10b981",
  focusing: "#f43f5e",
  talking: "#f59e0b",
};

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
      this.updateStatusIndicator(nicknameText, user.deskStatus);
    } else {
      nicknameText = this.createNicknameText(
        avatarModel.x,
        avatarModel.y - NICKNAME_OFFSET_Y,
        user.nickname,
        user.deskStatus,
      );
      this.nicknameTexts.set(user.id, nicknameText);
    }

    nicknameText.setDepth(depth);
  }

  private createNicknameText(
    x: number,
    y: number,
    nickname: string,
    deskStatus: DeskStatus | null,
  ): Phaser.GameObjects.DOMElement {
    const div = document.createElement("div");
    div.className =
      "flex items-center text-[4px] leading-none text-white " +
      "bg-black/70 px-[3px] py-[2px] rounded " +
      "whitespace-nowrap pointer-events-none select-none";

    if (deskStatus) {
      const indicator = document.createElement("span");
      indicator.className = "status-indicator inline-block w-[3px] h-[3px] rounded-full shrink-0";
      indicator.style.backgroundColor = DESK_STATUS_INDICATOR_COLORS[deskStatus];
      div.appendChild(indicator);
    }

    const text = document.createElement("span");
    text.className = "ml-[1px]";

    text.textContent = nickname;
    div.appendChild(text);

    const domElement = this.scene.add.dom(x, y, div);
    domElement.setOrigin(0.5, 1);

    return domElement;
  }

  private updateStatusIndicator(domElement: Phaser.GameObjects.DOMElement, deskStatus: DeskStatus | null): void {
    const div = domElement.node as HTMLDivElement;
    let indicator = div.querySelector(".status-indicator") as HTMLSpanElement | null;

    if (deskStatus) {
      if (!indicator) {
        indicator = document.createElement("span");
        indicator.className = "status-indicator inline-block w-[3px] h-[3px] rounded-full shrink-0";
        div.insertBefore(indicator, div.firstChild);
      }
      indicator.style.backgroundColor = DESK_STATUS_INDICATOR_COLORS[deskStatus];
    } else if (indicator) {
      indicator.remove();
    }
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
