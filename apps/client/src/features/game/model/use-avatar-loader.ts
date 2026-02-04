import type { GameScene } from "../core";
import { GAME_SCENE_KEY } from "./game.constants";

import { useEffect, useRef } from "react";

import { useUserStore } from "@entities/user";
import type { User } from "@shared/types";

export const useAvatarLoader = (game: Phaser.Game | null) => {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!game) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (!gameScene) return;

    const applyUserToScene = (user: User) => {
      if (!loadedRef.current) {
        gameScene.loadAvatar(user);
        loadedRef.current = true;
        return;
      }

      gameScene.updateAvatar(user);
    };

    const tryApply = () => {
      const user = useUserStore.getState().user;
      if (user) applyUserToScene(user);
    };

    const onReady = () => {
      tryApply();
    };

    if (!gameScene.isReady) gameScene.events.once("scene:ready", onReady);
    else onReady();

    const unsubscribe = useUserStore.subscribe(
      (s) => ({ nickname: s.user?.nickname, assetKey: s.user?.avatar?.assetKey }),
      (next) => {
        if (!next.nickname || !next.assetKey) return;
        const user = useUserStore.getState().user;
        if (!user || !gameScene.isReady) return;
        applyUserToScene(user);
      },
      {
        equalityFn: (a, b) => a.nickname === b.nickname && a.assetKey === b.assetKey,
      },
    );

    return () => {
      unsubscribe();
      gameScene.events.off("scene:ready", onReady);
    };
  }, [game]);

  return null;
};
