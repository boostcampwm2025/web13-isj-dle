import {
  DEFAULT_EDITOR_OPTIONS,
  EDITOR_THEMES,
  type EditorLanguage,
  type EditorTheme,
  MONACO_EDITOR_OPTIONS,
  getAvailableLanguages,
} from "../model/code-editor.constants";
import { useCollaborativeEditor } from "../model/use-collaborative-editor";

import { useEffect, useMemo, useState } from "react";

import { COLLABORATION_TOOL, useCollaborationToolStore } from "@entities/collaboration-tool";
import { useUserStore } from "@entities/user";
import { GAME_SCENE_KEY, GameScene, usePhaserGame } from "@features/game";
import Editor, { useMonaco } from "@monaco-editor/react";
import { CollaborationModal } from "@shared/ui";

const CodeEditorModal = () => {
  const activeTool = useCollaborationToolStore((state) => state.activeTool);
  const closeTool = useCollaborationToolStore((state) => state.closeTool);

  const isOpen = activeTool === COLLABORATION_TOOL.CODE_EDITOR;

  const [language, setLanguage] = useState<EditorLanguage>(DEFAULT_EDITOR_OPTIONS.language);
  const [theme, setTheme] = useState<EditorTheme>(DEFAULT_EDITOR_OPTIONS.theme);

  const monaco = useMonaco();

  const availableLanguages = useMemo(() => {
    if (monaco) {
      return getAvailableLanguages(monaco);
    }
    return [];
  }, [monaco]);

  const user = useUserStore((state) => state.user);
  const roomId = user?.avatar.currentRoomId || "default";

  const { game } = usePhaserGame();

  const { handleEditorDidMount, isConnected } = useCollaborativeEditor({
    roomName: roomId,
  });

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

  const headerControls = (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="language-select" className="text-sm text-gray-600">
          언어:
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as EditorLanguage)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          disabled={!availableLanguages.length}
        >
          {availableLanguages.length > 0 ? (
            availableLanguages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))
          ) : (
            <option>불러오는 중...</option>
          )}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="theme-select" className="text-sm text-gray-600">
          테마:
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as EditorTheme)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          {EDITOR_THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          title={isConnected ? "연결됨" : "연결 끊김"}
        />
      </div>
    </div>
  );

  return (
    <CollaborationModal isOpen={isOpen} onClose={closeTool} title="코드 에디터" headerControls={headerControls}>
      <Editor
        height="100%"
        language={language}
        theme={theme}
        options={MONACO_EDITOR_OPTIONS}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-500">에디터 로딩 중...</div>
          </div>
        }
      />
    </CollaborationModal>
  );
};

export default CodeEditorModal;
