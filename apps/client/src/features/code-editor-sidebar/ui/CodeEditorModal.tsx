import { Suspense, lazy, useEffect } from "react";

import { COLLABORATION_TOOL, useCollaborationToolStore } from "@entities/collaboration-tool";
import { GAME_SCENE_KEY, type GameScene, usePhaserGame } from "@features/game";

const LazyCodeEditorModalContent = lazy(() => import("./CodeEditorModalContent"));

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

  return (
    <Suspense>
      <LazyCodeEditorModalContent />
    </Suspense>
  );
};

export default CodeEditorModal;
