import type { GameScene } from "../core";
import { GAME_SCENE_KEY } from "./game.constants";

import { useEffect, useRef } from "react";

import { useUserStore } from "@entities/user";

export const useAvatarLoader = (game: Phaser.Game | null) => {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!game || loadedRef.current) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (gameScene.isLoadPlayer) return;

    const tryLoad = () => {
      const user = useUserStore.getState().user;
      if (!user) return false;

      gameScene.loadAvatar(user);
      loadedRef.current = true;
      return true;
    };

    const loadUserAvatar = () => {
      if (tryLoad()) return;

      const unsubscribe = useUserStore.subscribe((state) => {
        if (state.user && !loadedRef.current) {
          gameScene.loadAvatar(state.user);
          loadedRef.current = true;
          unsubscribe();
        }
      });
    };

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", loadUserAvatar);
    } else {
      loadUserAvatar();
    }
  }, [game]);

  return null;
};
