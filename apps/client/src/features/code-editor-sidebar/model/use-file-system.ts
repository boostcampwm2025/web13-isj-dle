import { DEFAULT_EDITOR_OPTIONS, type EditorLanguage } from "./code-editor.constants";
import { type FileSystemItem } from "./file-explorer.utils";
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
      const fsMap = ydocRef.current.getMap<FileSystemItem>("file-system");

      let finalName = name;
      if (type === "file" && monaco) {
        const parts = name.split(".");
        if (parts.length === 1) {
          finalName = `${name}.txt`;
        } else {
          const ext = `.${parts[parts.length - 1]}`;
          const languages = monaco.languages.getLanguages();
          const isSupported = languages.some((lang: Monaco.languages.ILanguageExtensionPoint) => {
            return lang.extensions?.some((e: string) => e.toLowerCase() === ext.toLowerCase());
          });
          if (!isSupported) {
            finalName = `${name}.txt`;
          }
        }
      }

      const id = crypto.randomUUID();
      const item: FileSystemItem = { id, name: finalName, type, parentId };
      fsMap.set(id, item);

      if (type === "file") {
        selectFile(id);
        console.log("File created with id:", id);
      }
    },
    [monaco, ydocRef, selectFile],
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
      const fsMap = ydocRef.current.getMap<FileSystemItem>("file-system");
      const item = fsMap.get(id);
      if (item) {
        fsMap.set(id, { ...item, name: newName });
      }
    },
    [ydocRef],
  );

  useEffect(() => {
    if (!isInitialized || !ydocRef.current) return;
    const ydoc = ydocRef.current;

    const init = () => {
      const fsMap = ydoc.getMap<FileSystemItem>("file-system");
      const items = fsMap.toJSON();
      if (Object.keys(items).length === 0) {
        createItem("readme", "file", null);
      }
    };

    init();
  }, [isInitialized, createItem, ydocRef]);

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
