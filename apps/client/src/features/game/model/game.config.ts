import { GameScene } from "../core";
import Phaser from "phaser";

export const getGameConfig = (containerRef: HTMLElement): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent: containerRef,
    dom: {
      createContainer: true,
    },
    audio: {
      noAudio: true,
    },
    banner: false,
    scene: GameScene,
    pixelArt: true,
    render: { roundPixels: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    fps: {
      target: 60,
      forceSetTimeOut: true,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    backgroundColor: "#DFC7B2",
  };
};
