import type { EditorTheme } from "../model/code-editor.constants";
import { type FileSystemItem, buildTree } from "../model/file-explorer.utils";
import { FileExplorerItem } from "./FileExplorerItem";
import { File, FilePlus, Folder, FolderPlus } from "lucide-react";

import { useMemo, useState } from "react";

interface FileExplorerProps {
  theme: EditorTheme;
  fileSystem: Record<string, FileSystemItem>;
  createItem: (name: string, type: "file" | "folder", parentId: string | null) => void;
  deleteItem: (id: string, isFolder: boolean) => void;
  renameItem: (id: string, newName: string) => void;
  selectFile: (id: string) => void;
  selectedFileId: string | null;
}

const FileExplorer = ({
  theme,
  fileSystem,
  createItem,
  deleteItem,
  renameItem,
  selectFile,
  selectedFileId,
}: FileExplorerProps) => {
  const tree = useMemo(() => buildTree(fileSystem), [fileSystem]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // State for creating items
  const [isCreatingRoot, setIsCreatingRoot] = useState<"file" | "folder" | null>(null);
  const [newRootItemName, setNewRootItemName] = useState("");
  const [creatingState, setCreatingState] = useState<{ parentId: string; type: "file" | "folder" } | null>(null);

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const checkDuplicate = (name: string, parentId: string | null) => {
    return Object.values(fileSystem).some((item) => item.parentId === parentId && item.name === name);
  };

  const handleCreateRootSubmit = () => {
    if (newRootItemName.trim() && isCreatingRoot) {
      if (checkDuplicate(newRootItemName, null)) {
        alert("A file or folder with this name already exists in the root directory.");
        return; // Keep input open
      }
      createItem(newRootItemName, isCreatingRoot, null);
    }
    setIsCreatingRoot(null);
    setNewRootItemName("");
  };

  const handleNestedCreateItem = (name: string, type: "file" | "folder", parentId: string) => {
    if (checkDuplicate(name, parentId)) {
      alert("A file or folder with this name already exists in this folder.");
      return;
    }
    createItem(name, type, parentId);
  };

  return (
    <div
      className={`flex h-full flex-col border-r select-none ${
        theme === "vs" ? "border-gray-200 bg-gray-50" : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div
        className={`flex items-center justify-between border-b px-3 py-2 ${
          theme === "vs" ? "border-gray-200" : "border-zinc-800"
        }`}
      >
        <span className={`text-sm font-semibold ${theme === "vs" ? "text-gray-700" : "text-gray-300"}`}>EXPLORER</span>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsCreatingRoot("file")}
            className={`cursor-pointer rounded p-1 ${theme === "vs" ? "text-gray-700 hover:bg-gray-200" : "text-gray-400 hover:bg-gray-700"}`}
            title="새 파일"
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={() => setIsCreatingRoot("folder")}
            className={`cursor-pointer rounded p-1 ${theme === "vs" ? "text-gray-700 hover:bg-gray-200" : "text-gray-400 hover:bg-gray-700"}`}
            title="새 폴더"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isCreatingRoot && (
          <div className="flex items-center px-2 py-1 pl-5">
            <span className="mr-2 text-blue-500">
              {isCreatingRoot === "folder" ? <Folder size={16} /> : <File size={16} />}
            </span>
            <input
              autoFocus
              type="text"
              className={`flex-1 border border-blue-500 px-1 py-0 text-sm focus:outline-none ${
                theme === "vs" ? "bg-white text-black" : "bg-gray-800 text-white"
              }`}
              value={newRootItemName}
              onChange={(e) => setNewRootItemName(e.target.value)}
              onBlur={handleCreateRootSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateRootSubmit();
                if (e.key === "Escape") {
                  setIsCreatingRoot(null);
                  setNewRootItemName("");
                }
              }}
            />
          </div>
        )}

        {tree.map((node) => (
          <FileExplorerItem
            key={node.id}
            theme={theme}
            node={node}
            depth={0}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            selectedFileId={selectedFileId}
            onSelect={selectFile}
            onDelete={deleteItem}
            onRename={renameItem}
            creatingState={creatingState}
            setCreatingState={setCreatingState}
            onCreateItem={handleNestedCreateItem}
          />
        ))}

        {tree.length === 0 && !isCreatingRoot && (
          <div className={`px-4 py-8 text-center text-sm ${theme === "vs" ? "text-gray-700" : "text-gray-400"}`}>
            No files yet.
            <br />
            Create one to start!
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
