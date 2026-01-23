import { NICKNAME_OFFSET_Y, RESTAURANT_THUMBNAIL_OFFSET_Y } from "../model/game.constants";
import Phaser from "phaser";

import { useRestaurantImageEntityStore, useRestaurantImageViewStore } from "@entities/restaurant-image";

export class RestaurantImageManager {
  private readonly scene: Phaser.Scene;
  private thumbnailButton?: Phaser.GameObjects.DOMElement;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(params: { currentRoomId: string; userId: string | null; x: number; y: number }): void {
    const { currentRoomId, userId, x, y } = params;

    if (currentRoomId !== "restaurant" || !userId) {
      this.destroy();
      return;
    }

    if (!this.thumbnailButton) {
      this.thumbnailButton = this.createThumbnailButton(x, y, userId);
      this.thumbnailButton.setDepth(Number.MAX_SAFE_INTEGER + 0.1);
    }

    this.thumbnailButton.setPosition(x, y - NICKNAME_OFFSET_Y - RESTAURANT_THUMBNAIL_OFFSET_Y);
    this.updateThumbnailButtonNode(this.thumbnailButton.node as HTMLButtonElement, userId);
  }

  destroy(): void {
    this.thumbnailButton?.destroy();
    this.thumbnailButton = undefined;
  }

  private createThumbnailButton(x: number, y: number, userId: string): Phaser.GameObjects.DOMElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "w-[10px] h-[10px] rounded-[2px] bg-white/90 border border-black/30 flex items-center justify-center cursor-pointer p-0";

    const img = document.createElement("img");
    img.className = "thumbnail-img hidden w-full h-full rounded-[2px] object-cover";
    img.alt = "";

    const text = document.createElement("span");
    text.className =
      "thumbnail-text flex h-full w-full items-center justify-center text-[8px] leading-none font-bold text-gray-500";
    button.append(img, text);

    this.updateThumbnailButtonNode(button, userId);
    button.onclick = (e) => {
      e.stopPropagation();

      const entity = useRestaurantImageEntityStore.getState();
      const restaurantImage = useRestaurantImageViewStore.getState();

      const url = entity.getThumbnailUrlByUserId(userId);
      if (!url) {
        restaurantImage.requestUpload(userId);
      } else {
        restaurantImage.openViewer({ userId, imageUrl: url });
      }
    };

    const dom = this.scene.add.dom(x, y, button);
    dom.setOrigin(0.5, 1);
    return dom;
  }

  private updateThumbnailButtonNode(button: HTMLButtonElement, userId: string): void {
    const entity = useRestaurantImageEntityStore.getState();
    const url = entity.getThumbnailUrlByUserId(userId);
    const hasThumbnail = Boolean(url);

    const img = button.querySelector(".thumbnail-img") as HTMLImageElement | null;
    const text = button.querySelector(".thumbnail-text") as HTMLSpanElement | null;

    if (img) {
      img.src = hasThumbnail ? (url ?? "") : "";
      img.classList.toggle("hidden", !hasThumbnail);
    }
    if (text) {
      text.textContent = hasThumbnail ? "" : "+";
      text.classList.toggle("hidden", hasThumbnail);
    }
  }
}
