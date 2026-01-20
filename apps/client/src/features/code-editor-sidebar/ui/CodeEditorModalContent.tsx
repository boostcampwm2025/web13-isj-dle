import {
  DEFAULT_EDITOR_OPTIONS,
  type EditorLanguage,
  type EditorTheme,
  MONACO_EDITOR_OPTIONS,
  getAvailableLanguages,
} from "../model/code-editor.constants";
import { useCollaborativeEditor } from "../model/use-collaborative-editor";
import CodeEditorControls from "./CodeEditorControls";
import RemoteCursors from "./RemoteCursors";
import type * as Monaco from "monaco-editor";
import { type WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

import { useEffect, useMemo, useState } from "react";

import { useCollaborationToolStore } from "@entities/collaboration-tool";
import { useUserStore } from "@entities/user";
import Editor, { useMonaco } from "@monaco-editor/react";
import { CollaborationModal } from "@shared/ui";

type Awareness = WebsocketProvider["awareness"];

const CodeEditorModalContent = () => {
  const closeTool = useCollaborationToolStore((state) => state.closeTool);
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

  const { handleEditorDidMount, isConnected, isInitialized, editorRef, awarenessRef, ytextRef } =
    useCollaborativeEditor({
      roomName: roomId,
    });

  const [remoteCursorData, setRemoteCursorData] = useState<{
    editor: Monaco.editor.IStandaloneCodeEditor;
    awareness: Awareness;
    ytext: Y.Text;
  } | null>(null);

  useEffect(() => {
    if (isInitialized && editorRef.current && awarenessRef.current && ytextRef.current) {
      setRemoteCursorData({
        editor: editorRef.current,
        awareness: awarenessRef.current,
        ytext: ytextRef.current,
      });
    } else {
      setRemoteCursorData(null);
    }
  }, [isInitialized, editorRef, awarenessRef, ytextRef]);

  return (
    <CollaborationModal
      isOpen
      onClose={closeTool}
      title="코드 에디터"
      headerControls={
        <CodeEditorControls
          language={language}
          theme={theme}
          availableLanguages={availableLanguages}
          isConnected={isConnected}
          onLanguageChange={setLanguage}
          onThemeChange={setTheme}
        />
      }
    >
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
      {remoteCursorData && (
        <RemoteCursors
          editor={remoteCursorData.editor}
          awareness={remoteCursorData.awareness}
          ytext={remoteCursorData.ytext}
        />
      )}
    </CollaborationModal>
  );
};

export default CodeEditorModalContent;
