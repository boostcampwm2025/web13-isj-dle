import { type ReactNode, useEffect, useMemo, useState } from "react";

import { useWebSocket } from "@features/socket";

import { PhaserContext } from "./use-phaser-game";
import { useRoom } from "./use-room";

interface PhaserProviderProps {
  children?: ReactNode;
}

export const PhaserProvider = ({ children }: PhaserProviderProps) => {
  const { setGame: setWebSocketGame } = useWebSocket();
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const { joinRoom } = useRoom();

  const value = useMemo(
    () => ({
      game,
      setGame,
      joinRoom,
    }),
    [game, joinRoom],
  );

  useEffect(() => {
    setWebSocketGame(game);

    return () => {
      setWebSocketGame(null);
    };
  }, [game, setWebSocketGame]);

  return <PhaserContext.Provider value={value}>{children}</PhaserContext.Provider>;
};
