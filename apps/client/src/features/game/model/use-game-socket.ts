import type { GameScene } from "../core/game-scene";
import { GAME_SCENE_KEY } from "./game.constants";
import type { Socket } from "socket.io-client";

import { useEffect } from "react";

export const useGameSocket = (game: Phaser.Game | null, socket: Socket | null, isConnected: boolean) => {
  useEffect(() => {
    if (!game || !isConnected || !socket) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (gameScene.isInitializedSocket) return;

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", () => gameScene.setSocket(socket));
    } else {
      gameScene.setSocket(socket);
    }
  }, [game, socket, isConnected]);

  return null;
};
