import { type EditorTheme, THEME_COLORS } from "../model/code-editor.constants";
import { type FileSystemNode, getLanguageFromFileName } from "../model/file-explorer.utils";
import { ChevronDown, ChevronRight, Edit2, File, FilePlus, Folder, FolderOpen, FolderPlus, Trash2 } from "lucide-react";
import type * as Monaco from "monaco-editor";

import { useEffect, useState } from "react";

interface FileExplorerItemProps {
  theme: EditorTheme;
  monaco: typeof Monaco | null;
  node: FileSystemNode;
  depth: number;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  selectedFileId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  setLanguage: (language: string) => void;
  creatingState: { parentId: string; type: "file" | "folder" } | null;
  setCreatingState: (state: { parentId: string; type: "file" | "folder" } | null) => void;
  onCreateItem: (name: string, type: "file" | "folder", parentId: string) => void;
}

export const FileExplorerItem = ({
  theme,
  monaco,
  node,
  depth,
  expandedFolders,
  toggleFolder,
  selectedFileId,
  onSelect,
  onDelete,
  onRename,
  setLanguage,
  creatingState,
  setCreatingState,
  onCreateItem,
}: FileExplorerItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [newItemName, setNewItemName] = useState("");

  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedFileId === node.id;
  const isCreatingChild = creatingState?.parentId === node.id;

  useEffect(() => {
    const resetEdit = () => {
      setIsEditing(false);
      setEditName(node.name);

      const language = getLanguageFromFileName(node.name, monaco) || "plaintext";
      setLanguage(language);
    };

    resetEdit();
  }, [monaco, node.name, setLanguage]);

  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== node.name) {
      onRename(node.id, editName);
    }
    setIsEditing(false);
  };

  const handleCreateSubmit = () => {
    if (newItemName.trim() && creatingState) {
      onCreateItem(newItemName, creatingState.type, creatingState.parentId);
    }
    setCreatingState(null);
    setNewItemName("");
  };

  return (
    <div>
      <div
        className={`group flex cursor-pointer items-center px-2 py-1 ${THEME_COLORS[theme].hoverBg} ${isSelected ? THEME_COLORS[theme].selectedBg : ""}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (node.type === "folder") {
            toggleFolder(node.id);
          } else {
            onSelect(node.id);
          }
        }}
      >
        <span className={`mr-1 ${THEME_COLORS[theme].textColor}`}>
          {node.type === "folder" ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </span>

        <span className="mr-2 text-blue-500">
          {node.type === "folder" ? isExpanded ? <FolderOpen size={16} /> : <Folder size={16} /> : <File size={16} />}
        </span>

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
            }}
            autoFocus
            className={`flex-1 border border-blue-500 px-1 py-0 text-sm focus:outline-none ${THEME_COLORS[theme].bg} ${THEME_COLORS[theme].textColor}`}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate text-sm select-none ${THEME_COLORS[theme].textColor}`}>{node.name}</span>
        )}

        <div className="hidden items-center space-x-1 group-hover:flex">
          {node.type === "folder" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingState({ parentId: node.id, type: "file" });
                  if (!isExpanded) toggleFolder(node.id);
                }}
                className={`rounded p-0.5 ${THEME_COLORS[theme].textColor}`}
                title="새 파일"
              >
                <FilePlus size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingState({ parentId: node.id, type: "folder" });
                  if (!isExpanded) toggleFolder(node.id);
                }}
                className={`rounded p-0.5 ${THEME_COLORS[theme].textColor}`}
                title="새 폴더"
              >
                <FolderPlus size={12} />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className={`rounded p-0.5 ${THEME_COLORS[theme].textColor}`}
            title="이름 변경"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className={`rounded p-0.5 ${THEME_COLORS[theme].deletedTextColor}`}
            title="삭제"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {node.type === "folder" && isExpanded && (
        <div className="flex flex-col">
          {isCreatingChild && (
            <div className="flex items-center px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
              <span className="mr-2 text-blue-500">
                {creatingState.type === "folder" ? <Folder size={16} /> : <File size={16} />}
              </span>
              <input
                autoFocus
                type="text"
                className={`flex-1 border border-blue-500 px-1 py-0 text-sm focus:outline-none ${THEME_COLORS[theme].bg} ${THEME_COLORS[theme].textColor}`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={handleCreateSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSubmit();
                  if (e.key === "Escape") {
                    setCreatingState(null);
                    setNewItemName("");
                  }
                }}
              />
            </div>
          )}
          {node.children.map((child) => (
            <FileExplorerItem
              key={child.id}
              theme={theme}
              monaco={monaco}
              node={child}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              selectedFileId={selectedFileId}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
              setLanguage={setLanguage}
              creatingState={creatingState}
              setCreatingState={setCreatingState}
              onCreateItem={onCreateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};
