import {
  DEFAULT_EDITOR_OPTIONS,
  type EditorLanguage,
  VALID_FILENAME_MESSAGE,
  VALID_FILENAME_REGEX,
} from "./code-editor.constants";
import { type FileSystemItem, getLanguageFromFileName } from "./file-explorer.utils";
import type * as Monaco from "monaco-editor";
import type * as Y from "yjs";

import { type RefObject, useCallback, useEffect, useState } from "react";

export const useFileSystem = (
  ydocRef: RefObject<Y.Doc | null>,
  isInitialized: boolean,
  monaco: typeof Monaco | null,
) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [language, setLanguage] = useState<EditorLanguage>(DEFAULT_EDITOR_OPTIONS.language);
  const [fileSystem, setFileSystem] = useState<Record<string, FileSystemItem>>({});

  useEffect(() => {
    if (!isInitialized || !ydocRef.current) return;

    const fsMap = ydocRef.current.getMap<FileSystemItem>("file-system");
    const updateFileSystem = () => {
      setFileSystem(fsMap.toJSON());
    };

    fsMap.observe(updateFileSystem);
    updateFileSystem();

    return () => {
      fsMap.unobserve(updateFileSystem);
    };
  }, [isInitialized, ydocRef]);

  const selectFile = useCallback((id: string | null) => {
    setSelectedFileId(id);
  }, []);

  const createItem = useCallback(
    (name: string, type: "file" | "folder", parentId: string | null) => {
      if (!ydocRef.current) return;
      if (!VALID_FILENAME_REGEX.test(name)) {
        alert(VALID_FILENAME_MESSAGE);
        return;
      }

      let finalName = name;
      if (type === "file" && monaco) {
        const parts = name.split(".");
        if (parts.length === 1) {
          finalName = name.endsWith(".") ? `${name}txt` : `${name}.txt`;
        } else {
          const ext = `.${parts[parts.length - 1]}`;
          const languages = monaco.languages.getLanguages();
          const isSupported = languages.some((lang: Monaco.languages.ILanguageExtensionPoint) => {
            return lang.extensions?.some((e: string) => e.toLowerCase() === ext.toLowerCase());
          });
          if (!isSupported) {
            finalName = name.endsWith(".") ? `${name}txt` : `${name}.txt`;
          }
        }
      }

      const fsMap = ydocRef.current.getMap<FileSystemItem>("file-system");
      const items = fsMap.toJSON();
      const isDuplicate = Object.values(items).some((item) => item.name === finalName && item.parentId === parentId);
      if (isDuplicate) {
        alert(`같은 이름의 항목이 이미 존재합니다.\n다른 이름을 사용해주세요. (${finalName})`);
        return;
      }

      const id = crypto.randomUUID();
      const item: FileSystemItem = { id, name: finalName, type, parentId };
      fsMap.set(id, item);
    },
    [monaco, ydocRef],
  );

  const deleteItem = useCallback(
    (id: string) => {
      if (!ydocRef.current) return;
      const fsMap = ydocRef.current.getMap<FileSystemItem>("file-system");
      const items = fsMap.toJSON();

      const deleteFiles = (targetId: string) => {
        const toDelete: string[] = [targetId];

        for (let i = 0; i < toDelete.length; i++) {
          Object.values(items).forEach((item) => {
            if (item.parentId === toDelete[i]) {
              toDelete.push(item.id);
            }
          });
        }

        toDelete.forEach((id) => {
          fsMap.delete(id);
          if (selectedFileId === id) {
            selectFile(null);
          }
        });
      };

      deleteFiles(id);
    },
    [ydocRef, selectedFileId, selectFile],
  );

  const renameItem = useCallback(
    (id: string, newName: string) => {
      if (!ydocRef.current) return;
      if (!VALID_FILENAME_REGEX.test(newName)) {
        alert(VALID_FILENAME_MESSAGE);
        return;
      }

      const fsMap = ydocRef.current.getMap<FileSystemItem>("file-system");
      const renameItem = fsMap.get(id);
      if (renameItem) {
        const items = fsMap.toJSON();
        const isDuplicate = Object.values(items).some(
          (item) => item.name === newName && item.parentId === renameItem.parentId && item.id !== id,
        );
        if (isDuplicate) {
          alert("같은 이름의 항목이 이미 존재합니다. 다른 이름을 사용해주세요.");
          return;
        }
        fsMap.set(id, { ...renameItem, name: newName });
        if (selectedFileId === id) {
          const language = getLanguageFromFileName(newName, monaco);
          if (language) {
            setLanguage(language);
          }
        }
      }
    },
    [ydocRef, selectedFileId, monaco, setLanguage],
  );

  return {
    fileSystem,
    createItem,
    deleteItem,
    renameItem,
    selectedFileId,
    selectFile,
    language,
    setLanguage,
  };
};
