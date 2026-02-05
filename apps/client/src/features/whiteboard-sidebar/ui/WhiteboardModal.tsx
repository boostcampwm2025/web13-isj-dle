import { useEffect } from "react";

import { COLLABORATION_TOOL, useCollaborationToolStore } from "@entities/collaboration-tool";
import { GAME_SCENE_KEY, GameScene, usePhaserGame } from "@features/game";
import "@tldraw/tldraw/tldraw.css";

import WhiteboardModalContent from "./WhiteboardModalContent";

const WhiteboardModal = () => {
  const activeTool = useCollaborationToolStore((state) => state.activeTool);
  const isOpen = activeTool === COLLABORATION_TOOL.WHITEBOARD;

  const { game } = usePhaserGame();

  useEffect(() => {
    if (!game) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (!gameScene) return;

    if (isOpen) {
      gameScene.setInputEnabled(false);
    }

    return () => {
      gameScene.setInputEnabled(true);
    };
  }, [game, isOpen]);

  if (!isOpen) {
    return null;
  }

  return <WhiteboardModalContent />;
};

export default WhiteboardModal;
