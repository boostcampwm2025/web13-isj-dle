import { createContext, useContext } from "react";

interface PhaserContextType {
  game: Phaser.Game | null;
}

export const PhaserContext = createContext<PhaserContextType>({ game: null });

export const usePhaserGame = () => useContext(PhaserContext);
