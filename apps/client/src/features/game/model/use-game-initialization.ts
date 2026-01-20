import { getGameConfig } from "./game.config";
import { usePhaserGame } from "./use-phaser-game";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import { useAction } from "@features/actions";
import { useWebSocket } from "@features/socket";

export const useGameInitialization = (containerRef: RefObject<HTMLDivElement | null>) => {
  const { getHookByKey } = useAction();
  const { socket } = useWebSocket();
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

  useEffect(() => {
    const deskZoneAction = getHookByKey("desk_zone");
    if (deskZoneAction && deskZoneAction.setGame && deskZoneAction.setSocket) {
      deskZoneAction.setGame(game);
      deskZoneAction.setSocket(socket);
    }
  }, [getHookByKey, game, socket]);

  return {
    game,
  };
};
