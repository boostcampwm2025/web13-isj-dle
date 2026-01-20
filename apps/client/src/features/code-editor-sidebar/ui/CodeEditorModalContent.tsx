import { MONACO_EDITOR_OPTIONS } from "../model/code-editor.constants";
import { useCodeEditor } from "../model/use-code-editor";
import { useEditorBinding } from "../model/use-editor-binding";
import { useFileSystem } from "../model/use-file-system";
import { useRemoteCursor } from "../model/use-remote-cursor";
import { useYjs } from "../model/use-yjs";
import CodeEditorControls from "./CodeEditorControls";
import FileExplorer from "./FileExplorer";
import RemoteCursors from "./RemoteCursors";
import { Files } from "lucide-react";

import { useCollaborationToolStore } from "@entities/collaboration-tool";
import { useUserStore } from "@entities/user";
import Editor from "@monaco-editor/react";
import { CollaborationModal } from "@shared/ui";

const CodeEditorModalContent = () => {
  const closeTool = useCollaborationToolStore((state) => state.closeTool);
  const user = useUserStore((state) => state.user);
  const roomId = user?.avatar.currentRoomId || "default";

  const { monaco, theme, setTheme, availableLanguages, showExplorer, setShowExplorer } = useCodeEditor();
  const { ydocRef, providerRef, awarenessRef, isConnected, isInitialized } = useYjs(roomId);
  const { fileSystem, createItem, deleteItem, renameItem, selectedFileId, selectFile, language, setLanguage } =
    useFileSystem(ydocRef, isInitialized, monaco);
  const { handleEditorDidMount, editorRef, ytextRef } = useEditorBinding(
    ydocRef,
    providerRef,
    monaco,
    selectedFileId,
    fileSystem,
    setLanguage,
  );
  const { remoteCursorData } = useRemoteCursor({ isInitialized, editorRef, awarenessRef, ytextRef });

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
      <div className="flex h-full w-full overflow-hidden">
        <div
          className={`flex w-12 flex-col items-center border-r py-4 ${
            theme === "vs" ? "border-gray-200 bg-gray-50" : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className={`flex h-10 w-10 items-center justify-center rounded-md ${
              theme === "vs" ? "hover:bg-gray-200" : "hover:bg-zinc-800"
            } ${showExplorer ? "text-blue-500" : "text-gray-500"}`}
            title="Toggle Explorer"
          >
            <Files size={20} />
          </button>
        </div>

        {showExplorer && (
          <div
            className={`h-full w-64 shrink-0 border-r text-gray-400 ${
              theme === "vs" ? "border-gray-200 bg-gray-50" : "border-zinc-800 bg-zinc-900"
            }`}
          >
            <FileExplorer
              theme={theme}
              fileSystem={fileSystem}
              createItem={createItem}
              deleteItem={deleteItem}
              renameItem={renameItem}
              selectFile={selectFile}
              selectedFileId={selectedFileId}
            />
          </div>
        )}

        <div className="relative h-full min-w-0 flex-1">
          {!selectedFileId && (
            <div
              className={`absolute inset-0 z-10 flex items-center justify-center text-gray-400 ${
                theme === "vs" ? "bg-gray-50" : "bg-zinc-900"
              }`}
            >
              <div>Select a file to start editing</div>
            </div>
          )}

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
        </div>
      </div>
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
