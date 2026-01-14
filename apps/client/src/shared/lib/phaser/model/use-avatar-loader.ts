import { GAME_SCENE_KEY } from "./game.constants";
import type { GameScene } from "./game.scene";

import { useEffect } from "react";

import type { User } from "@shared/types";

export const useAvatarLoader = (game: Phaser.Game | null, user: User | null) => {
  useEffect(() => {
    if (!game || !user) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (gameScene.isLoadPlayer) return;

    const loadUserAvatar = () => {
      gameScene.loadAvatar(user);
    };

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", loadUserAvatar);
    } else {
      loadUserAvatar();
    }
  }, [game, user]);

  return null;
};
