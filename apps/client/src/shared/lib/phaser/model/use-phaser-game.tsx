import { createContext, useContext } from "react";

interface PhaserContextType {
  game: Phaser.Game | null;
  setGame: (game: Phaser.Game | null) => void;
  joinRoom?: (roomId: string) => void;
}

export const PhaserContext = createContext<PhaserContextType | null>(null);

export const usePhaserGame = () => {
  const context = useContext(PhaserContext);
  if (!context) {
    throw new Error("usePhaserGame must be used within PhaserProvider");
  }
  return context;
};
