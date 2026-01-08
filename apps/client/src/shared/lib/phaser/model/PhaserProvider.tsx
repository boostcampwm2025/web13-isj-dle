import { PhaserContext } from "./use-phaser-game";

import { type ReactNode, useState } from "react";

interface PhaserProviderProps {
  children?: ReactNode;
}

export const PhaserProvider = ({ children }: PhaserProviderProps) => {
  const [game, setGame] = useState<Phaser.Game | null>(null);

  return <PhaserContext.Provider value={{ game, setGame }}>{children}</PhaserContext.Provider>;
};
