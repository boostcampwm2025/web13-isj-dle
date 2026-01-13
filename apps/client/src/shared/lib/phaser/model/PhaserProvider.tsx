import { PhaserContext } from "./use-phaser-game";
import { useRoom } from "./use-room";

import { type ReactNode, useMemo, useState } from "react";

interface PhaserProviderProps {
  children?: ReactNode;
}

export const PhaserProvider = ({ children }: PhaserProviderProps) => {
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

  return <PhaserContext.Provider value={value}>{children}</PhaserContext.Provider>;
};
