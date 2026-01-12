import { useWebSocket } from "../../websocket";
import { GAME_SCENE_KEY } from "../model/game.constants";
import type { GameScene } from "../model/game.scene";
import { usePhaserGame } from "../model/use-phaser-game";

import { useEffect, useRef, useState } from "react";

import { getGameConfig } from "@shared/lib/phaser/model/game.config";
import type { RoomType } from "@shared/types";
import { useUser } from "@src/entities/user";
import { RoomSelectorModal } from "@src/widgets/room-selector-modal";

interface PhaserLayoutProps {
  children: React.ReactNode;
}

const PhaserLayout = ({ children }: PhaserLayoutProps) => {
  const { game, setGame, joinRoom } = usePhaserGame();
  const { socket, isConnected } = useWebSocket();
  const { user } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [roomSelectorOpen, setRoomSelectorOpen] = useState(false);
  const [selectedRoomRange, setSelectedRoomRange] = useState<string>("");

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
  }, [game, setGame]);

  useEffect(() => {
    if (!game || !isConnected || !socket) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (gameScene.isInitializedSocket) return;

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", () => gameScene.setSocket(socket));
    } else {
      gameScene.setSocket(socket);
    }
  }, [game, socket, isConnected]);

  useEffect(() => {
    if (!game || !user) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (gameScene.isLoadPlayer) return;

    const loadUserAvatar = () => {
      gameScene.loadAvatar(user.avatar);
    };

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", loadUserAvatar);
    } else {
      loadUserAvatar();
    }
  }, [game, user]);

  useEffect(() => {
    if (game && joinRoom) {
      game.registry.set("joinRoom", joinRoom);
    }

    return () => {
      if (game) {
        game.registry.remove("joinRoom");
      }
    };
  }, [game, joinRoom]);

  useEffect(() => {
    if (!game) return;

    const openRoomSelector = (roomRange: string) => {
      setSelectedRoomRange(roomRange);
      setRoomSelectorOpen(true);
    };

    game.registry.set("openRoomSelector", openRoomSelector);

    return () => {
      game.registry.remove("openRoomSelector");
    };
  }, [game]);

  const handleRoomSelect = (roomId: RoomType) => {
    if (joinRoom) {
      joinRoom(roomId);
    }
    setRoomSelectorOpen(false);
  };

  const handleCloseModal = () => {
    setRoomSelectorOpen(false);
  };

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
      {/* 회의실 선택 모달 */}
      <RoomSelectorModal
        isOpen={roomSelectorOpen}
        roomRange={selectedRoomRange}
        onSelect={handleRoomSelect}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PhaserLayout;
