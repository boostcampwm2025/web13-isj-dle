import { IDLE_FRAME, NICKNAME_OFFSET_Y, RESTAURANT_THUMBNAIL_OFFSET_Y, SIT_FRAME } from "../model/game.constants";
import Phaser from "phaser";

import { useRestaurantImageStore, useRestaurantImageViewStore } from "@entities/restaurant-image";
import type { AvatarDirection, DeskStatus, User } from "@shared/types";

const DESK_STATUS_INDICATOR_COLORS: Record<DeskStatus, string> = {
  available: "#10b981",
  focusing: "#f43f5e",
  talking: "#f59e0b",
};

export class AvatarRenderer {
  private readonly scene: Phaser.Scene;
  private readonly avatars: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private readonly nicknameTexts: Map<string, Phaser.GameObjects.DOMElement> = new Map();
  private readonly thumbnailButtons: Map<string, Phaser.GameObjects.DOMElement> = new Map();
  private readonly thumbnailUrlCache: Map<number, string | null> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  renderAnotherAvatars(users: User[], baseDepth: number, currentSocketId?: string | null): void {
    const missingUsers = [...this.avatars.keys()].filter((socketId) => !users.find((u) => u.socketId === socketId));
    missingUsers.forEach((socketId) => {
      const avatar = this.avatars.get(socketId);
      if (avatar) {
        avatar.destroy();
        this.avatars.delete(socketId);
      }

      const nicknameText = this.nicknameTexts.get(socketId);
      if (nicknameText) {
        nicknameText.destroy();
        this.nicknameTexts.delete(socketId);
      }

      const thumbnail = this.thumbnailButtons.get(socketId);
      if (thumbnail) {
        thumbnail.destroy();
        this.thumbnailButtons.delete(socketId);
      }
    });

    users.sort((a, b) => a.avatar.y - b.avatar.y);

    users.forEach((user, index) => {
      this.renderSingleAvatar(user, baseDepth + index, currentSocketId);
    });
  }

  private renderSingleAvatar(user: User, depth: number, currentSocketId?: string | null): void {
    const avatarModel = user.avatar;

    let avatar = this.avatars.get(user.socketId);
    if (avatar) {
      avatar.setPosition(avatarModel.x, avatarModel.y);
      if (avatar.texture.key !== avatarModel.assetKey) {
        avatar.setTexture(avatarModel.assetKey, IDLE_FRAME[avatarModel.direction]);
      }
    } else {
      avatar = this.scene.add.sprite(
        avatarModel.x,
        avatarModel.y,
        avatarModel.assetKey,
        IDLE_FRAME[avatarModel.direction],
      );
      avatar.setOrigin(0.5, 0.75);
      this.avatars.set(user.socketId, avatar);
    }

    avatar.setDepth(depth);

    if (avatarModel.state === "sit") {
      this.toSit(avatar, avatarModel.direction);
    } else if (avatarModel.state === "walk") {
      this.toWalk(avatar, avatarModel.direction);
    } else if (avatarModel.state === "run") {
      this.toRun(avatar, avatarModel.direction);
    } else {
      this.toIdle(avatar, avatarModel.direction);
    }

    let nicknameText = this.nicknameTexts.get(user.socketId);
    if (nicknameText) {
      nicknameText.node.querySelector("span.nickname-text")!.textContent = user.nickname;
      this.updateNicknamePosition(nicknameText, avatar);
      this.updateStatusIndicator(nicknameText, user.deskStatus);
    } else {
      nicknameText = this.createNicknameText(
        avatarModel.x,
        avatarModel.y - NICKNAME_OFFSET_Y,
        user.nickname,
        user.deskStatus,
      );
      this.nicknameTexts.set(user.socketId, nicknameText);
    }

    nicknameText.setDepth(depth);

    if (avatarModel.currentRoomId === "restaurant") {
      this.renderThumbnailButton(user.socketId, user.userId, avatar, depth, currentSocketId === user.socketId);
    } else {
      this.removeThumbnailButton(user.socketId, user.userId);
    }
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
      indicator.className = "status-indicator inline-block w-[3px] h-[3px] rounded-full shrink-0 mr-0.5";
      indicator.style.backgroundColor = DESK_STATUS_INDICATOR_COLORS[deskStatus];
      div.appendChild(indicator);
    }

    const text = document.createElement("span");
    text.className = "nickname-text";
    text.textContent = nickname;
    div.appendChild(text);

    const domElement = this.scene.add.dom(x, y, div);
    domElement.setOrigin(0.5, 1);

    return domElement;
  }

  private updateStatusIndicator(domElement: Phaser.GameObjects.DOMElement, deskStatus: DeskStatus | null): void {
    const div = domElement.node as HTMLDivElement;
    let indicator = div.querySelector("span.status-indicator") as HTMLSpanElement | null;

    if (deskStatus) {
      if (!indicator) {
        indicator = document.createElement("span");
        indicator.className = "status-indicator inline-block w-[3px] h-[3px] rounded-full shrink-0 mr-0.5";
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

  private renderThumbnailButton(
    socketId: string,
    userId: number,
    avatar: Phaser.GameObjects.Sprite,
    depth: number,
    isMe: boolean,
  ): void {
    let button = this.thumbnailButtons.get(socketId);

    if (button) {
      this.updateThumbnailPosition(button, avatar);
      this.updateThumbnailButtonAppearance(button, userId, isMe);
    } else {
      button = this.createThumbnailButton(avatar.x, avatar.y - NICKNAME_OFFSET_Y, socketId, userId, isMe);
      this.thumbnailButtons.set(socketId, button);
      this.updateThumbnailPosition(button, avatar);
    }

    button.setDepth(depth + 0.1);
  }

  private createThumbnailButton(
    x: number,
    y: number,
    socketId: string,
    userId: number,
    isMe: boolean,
  ): Phaser.GameObjects.DOMElement {
    const button = document.createElement("button");
    button.type = "button";

    button.className =
      "w-[10px] h-[10px] rounded-[2px] bg-white/90 border border-black/30 text-black flex items-center justify-center p-0";

    const img = document.createElement("img");
    img.className = "thumbnail-img hidden w-full h-full rounded-[2px] object-cover";
    img.alt = "";

    const text = document.createElement("span");
    text.className =
      "thumbnail-text flex h-full w-full items-center justify-center text-[8px] leading-[10px] font-bold";
    button.append(img, text);

    this.updateThumbnailButtonNode(button, userId, isMe);
    button.dataset.socketId = socketId;
    button.onclick = (e) => {
      e.stopPropagation();

      const entity = useRestaurantImageStore.getState();
      const restaurantImage = useRestaurantImageViewStore.getState();
      const url = entity.getThumbnailUrlByUserId(userId);
      if (!url) {
        if (isMe) restaurantImage.requestUpload(userId);
      } else {
        restaurantImage.openViewer({ userId, imageUrl: url });
      }
    };

    const dom = this.scene.add.dom(x, y, button);
    dom.setOrigin(0.5, 1.2);

    return dom;
  }

  private updateThumbnailPosition(domElement: Phaser.GameObjects.DOMElement, sprite: Phaser.GameObjects.Sprite): void {
    domElement.setPosition(sprite.x, sprite.y - NICKNAME_OFFSET_Y - RESTAURANT_THUMBNAIL_OFFSET_Y);
  }

  private updateThumbnailButtonAppearance(
    domElement: Phaser.GameObjects.DOMElement,
    userId: number,
    isMe: boolean,
  ): void {
    const entity = useRestaurantImageStore.getState();
    const url = entity.getThumbnailUrlByUserId(userId);
    const cachedUrl = this.thumbnailUrlCache.get(userId);

    if (cachedUrl === url) return;

    this.thumbnailUrlCache.set(userId, url);
    const button = domElement.node as HTMLButtonElement;
    this.updateThumbnailButtonNode(button, userId, isMe);
  }

  private updateThumbnailButtonNode(button: HTMLButtonElement, userId: number, isMe: boolean): void {
    const entity = useRestaurantImageStore.getState();
    const url = entity.getThumbnailUrlByUserId(userId);
    const hasThumbnail = Boolean(url);

    const img = button.querySelector(".thumbnail-img") as HTMLImageElement | null;
    const text = button.querySelector(".thumbnail-text") as HTMLSpanElement | null;

    if (img) {
      img.src = hasThumbnail ? (url ?? "") : "";
      img.classList.toggle("hidden", !hasThumbnail);
    }
    if (text) {
      text.textContent = hasThumbnail ? "" : isMe ? "+" : "?";
      text.classList.toggle("hidden", hasThumbnail);
    }

    const disabled = !hasThumbnail && !isMe;
    button.disabled = disabled;
    button.classList.toggle("cursor-not-allowed", disabled);
    button.classList.toggle("opacity-50", disabled);
  }

  private removeThumbnailButton(socketId: string, userId: number): void {
    const button = this.thumbnailButtons.get(socketId);
    if (button) {
      button.destroy();
      this.thumbnailButtons.delete(socketId);
      this.thumbnailUrlCache.delete(userId);
    }
  }

  private toIdle(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    const key = `idle-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toWalk(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    const key = `walk-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toRun(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    const key = `run-${sprite.texture.key}-${dir}`;
    sprite.anims.play(key, true);
  }

  private toSit(sprite: Phaser.GameObjects.Sprite, dir: AvatarDirection): void {
    sprite.anims.stop();
    sprite.setFrame(SIT_FRAME[dir]);
  }

  destroy(): void {
    this.avatars.forEach((avatar) => avatar.destroy());
    this.nicknameTexts.forEach((text) => text.destroy());
    this.thumbnailButtons.forEach((btn) => btn.destroy());
    this.avatars.clear();
    this.nicknameTexts.clear();
    this.thumbnailButtons.clear();
    this.thumbnailUrlCache.clear();
  }
}
