import { MOVE_ROOM_MAP, isSameRoom } from "./space-move.constants";
import type { MovableRoom } from "./space-move.types";

import { useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import { GAME_SCENE_KEY, GameScene, usePhaserGame } from "@features/game";

export const useSpaceMove = () => {
  const { game } = usePhaserGame();
  const [gameScene, setGameScene] = useState<GameScene | null>(null);
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);

  useEffect(() => {
    if (!game) return;

    const setup = () => {
      const scene = game.scene.keys[GAME_SCENE_KEY] as GameScene;
      setGameScene(scene);
    };

    setup();
  }, [game]);

  const handleMoveSpace = (room: MovableRoom) => {
    if (!gameScene || !currentRoomId || isSameRoom(currentRoomId, room)) return;
    const { position } = MOVE_ROOM_MAP[room];
    gameScene.autoMove.movePlayer(position);
  };

  return { handleMoveSpace };
};
