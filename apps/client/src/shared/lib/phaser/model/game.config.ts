import { GameScene } from "./game.scene";
import Phaser from "phaser";

export function getGameConfig(containerRef: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: containerRef,
    dom: {
      createContainer: true,
    },
    scene: GameScene,
    pixelArt: true,
    render: { roundPixels: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: true,
      },
    },
  };
}
