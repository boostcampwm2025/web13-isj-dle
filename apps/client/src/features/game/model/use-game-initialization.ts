import { type RefObject, useEffect, useRef } from "react";

import { useActionStore } from "@features/actions";
import { useWebSocket } from "@features/socket";

import { usePhaserGame } from "./use-phaser-game";

export const useGameInitialization = (containerRef: RefObject<HTMLDivElement | null>) => {
  const actions = useActionStore((state) => state.actions);
  const { socket } = useWebSocket();
  const { game, setGame } = usePhaserGame();
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isInitializedRef.current || !containerRef.current || game) return;

    let cancelled = false;
    const container = containerRef.current;

    (async () => {
      const { createGame } = await import("./game.config");
      if (cancelled) return;

      const gameInstance = createGame(container);
      setGame(gameInstance);
      isInitializedRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [game, setGame, containerRef]);

  useEffect(() => {
    if (!game) return;

    return () => {
      game.destroy(true);
      setGame(null);
      isInitializedRef.current = false;
    };
  }, [game, setGame]);

  useEffect(() => {
    const deskZoneAction = actions.desk_zone;
    if (!deskZoneAction || !deskZoneAction.setGame) return;

    deskZoneAction.setGame(game);

    return () => {
      deskZoneAction?.setGame?.(null);
    };
  }, [actions, game, socket]);

  return {
    game,
  };
};
