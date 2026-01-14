import { getGameConfig } from "./game.config";
import { usePhaserGame } from "./use-phaser-game";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

export const useGameInitialization = (containerRef: RefObject<HTMLDivElement | null>) => {
  const { game, setGame } = usePhaserGame();
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isInitializedRef.current) return;

    if (containerRef.current && !game) {
      const config = getGameConfig(containerRef.current);
      const gameInstance = new Phaser.Game(config);
      setGame(gameInstance);
      isInitializedRef.current = true;
    }

    return () => {
      if (game) {
        game.destroy(true);
        setGame(null);
        isInitializedRef.current = false;
      }
    };
  }, [game, setGame, containerRef]);

  return {
    game,
  };
};
