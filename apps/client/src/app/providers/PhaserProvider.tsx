import { GameScene } from "../../shared/lib/game-scene";
import { PhaserContext } from "./PhaserContext";
import Phaser from "phaser";

import { type ReactNode, useEffect, useRef, useState } from "react";

interface PhaserProviderProps {
  children?: ReactNode;
}

export const PhaserProvider = ({ children }: PhaserProviderProps) => {
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !game) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        scene: GameScene,
        pixelArt: true,
        render: { roundPixels: true },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: true,
          },
        },
      };

      const gameInstance = new Phaser.Game(config);
      setGame(gameInstance);
    }

    return () => {
      if (game) {
        game.destroy(true);
        setGame(null);
      }
    };
  }, [game]);

  return (
    <PhaserContext.Provider value={{ game }}>
      <div
        ref={containerRef}
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      />
      {children}
    </PhaserContext.Provider>
  );
};
