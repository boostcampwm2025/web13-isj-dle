import { getGameConfig } from "../../shared/lib/phaser/game.config";
import { PhaserContext } from "./use-phaser-game";

import { type ReactNode, useEffect, useRef, useState } from "react";

interface PhaserProviderProps {
  children?: ReactNode;
}

export const PhaserProvider = ({ children }: PhaserProviderProps) => {
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !game) {
      const config = getGameConfig(containerRef.current);

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
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Phaser 게임 캔버스 */}
        <div
          ref={containerRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        />
        {/* UI 오버레이 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {children}
        </div>
      </div>
    </PhaserContext.Provider>
  );
};
