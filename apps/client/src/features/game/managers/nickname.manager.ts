import { NICKNAME_OFFSET_Y } from "../model/game.constants";
import Phaser from "phaser";

import type { DeskStatus } from "@shared/types";

const DESK_STATUS_COLORS: Record<DeskStatus, string> = {
  available: "#10b981",
  focusing: "#f43f5e",
  talking: "#f59e0b",
};

export class NicknameManager {
  private scene: Phaser.Scene;
  private nicknameElement?: Phaser.GameObjects.DOMElement;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createNickname(
    x: number,
    y: number,
    nickname: string,
    deskStatus?: DeskStatus | null,
  ): Phaser.GameObjects.DOMElement {
    const div = document.createElement("div");
    div.className =
      "flex items-center text-[4px] leading-none text-white bg-black/70 px-[3px] py-[2px] rounded whitespace-nowrap pointer-events-none select-none";

    if (deskStatus) {
      const indicator = this.createIndicatorElement(deskStatus);
      div.appendChild(indicator);
    }

    const text = document.createElement("span");
    text.className = "ml-[1px]";
    text.textContent = nickname;
    div.appendChild(text);

    const domElement = this.scene.add.dom(x, y, div);
    domElement.setOrigin(0.5, 1);

    this.nicknameElement = domElement;
    return domElement;
  }

  private createIndicatorElement(deskStatus: DeskStatus): HTMLSpanElement {
    const indicator = document.createElement("span");
    indicator.className = "status-indicator inline-block w-[3px] h-[3px] rounded-full shrink-0";
    indicator.style.backgroundColor = DESK_STATUS_COLORS[deskStatus];
    return indicator;
  }

  updatePosition(x: number, y: number): void {
    if (!this.nicknameElement) return;
    this.nicknameElement.setPosition(x, y - NICKNAME_OFFSET_Y);
  }

  updateNickname(nickname: string, x: number, y: number): void {
    if (!this.nicknameElement) return;
    const div = this.nicknameElement.node as HTMLDivElement;
    const textSpan = div.querySelector("span");
    if (textSpan) {
      textSpan.textContent = nickname;
    }
    this.nicknameElement.setPosition(x, y - NICKNAME_OFFSET_Y);
  }

  updateIndicator(deskStatus: DeskStatus | null): void {
    if (!this.nicknameElement) return;

    const div = this.nicknameElement.node as HTMLDivElement;
    let indicator = div.querySelector(".status-indicator") as HTMLSpanElement | null;

    if (deskStatus) {
      if (!indicator) {
        indicator = this.createIndicatorElement(deskStatus);
        div.insertBefore(indicator, div.firstChild);
      } else {
        indicator.style.backgroundColor = DESK_STATUS_COLORS[deskStatus];
      }
    } else if (indicator) {
      indicator.remove();
    }
  }

  setDepth(depth: number): void {
    this.nicknameElement?.setDepth(depth);
  }

  getNicknameElement(): Phaser.GameObjects.DOMElement | undefined {
    return this.nicknameElement;
  }
}
