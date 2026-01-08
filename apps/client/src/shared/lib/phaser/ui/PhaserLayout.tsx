import { usePhaserGame } from "../model/use-phaser-game";

import { useEffect, useRef } from "react";

import { getGameConfig } from "@shared/lib/phaser/model/game.config";

interface PhaserLayoutProps {
  children: React.ReactNode;
}

const PhaserLayout = ({ children }: PhaserLayoutProps) => {
  const { game, setGame } = usePhaserGame();
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
  }, [game, setGame]);

  return (
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
  );
};

export default PhaserLayout;
