import CodeEditorModalContent from "./CodeEditorModalContent";

import { useEffect } from "react";

import { COLLABORATION_TOOL, useCollaborationToolStore } from "@entities/collaboration-tool";
import { GAME_SCENE_KEY, GameScene, usePhaserGame } from "@features/game";

const CodeEditorModal = () => {
  const activeTool = useCollaborationToolStore((state) => state.activeTool);
  const isOpen = activeTool === COLLABORATION_TOOL.CODE_EDITOR;

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

  return <CodeEditorModalContent />;
};

export default CodeEditorModal;
