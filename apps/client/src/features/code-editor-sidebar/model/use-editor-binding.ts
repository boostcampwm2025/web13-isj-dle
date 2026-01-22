import { type FileSystemItem, getLanguageFromFileName } from "./file-explorer.utils";
import type * as Monaco from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

import { type RefObject, useCallback, useEffect, useRef } from "react";

export const useEditorBinding = (
  ydocRef: RefObject<Y.Doc | null>,
  providerRef: RefObject<WebsocketProvider | null>,
  monaco: typeof Monaco | null,
  selectedFileId: string | null,
  fileSystem: Record<string, FileSystemItem>,
  setLanguage: (language: string) => void,
  onSelectedFileDeleted: () => void,
) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  const handleEditorDidMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    const container = editor.getContainerDomNode();
    const ro = new ResizeObserver(() => {
      editor.layout({
        width: Math.ceil(container.clientWidth),
        height: Math.ceil(container.clientHeight),
      });
    });

    ro.observe(container);

    editor.onDidDispose(() => ro.disconnect());
  }, []);

  useEffect(() => {
    if (!editorRef.current || !monaco || !selectedFileId || !ydocRef.current || !providerRef.current) {
      return;
    }

    const item = fileSystem[selectedFileId];
    if (!item) {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (editorRef.current) {
        editorRef.current.setModel(null);
      }
      onSelectedFileDeleted();
      return;
    }

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const ytext = ydocRef.current.getText(`file-${selectedFileId}`);
    ytextRef.current = ytext;
    const uri = monaco.Uri.parse(`file:///${selectedFileId}`);

    let model = monaco.editor.getModel(uri);
    const language = getLanguageFromFileName(item.name, monaco) || "plaintext";
    setLanguage(language);

    if (!model) {
      model = monaco.editor.createModel("", language, uri);
    }

    editorRef.current.setModel(model);
    const binding = new MonacoBinding(ytext, model, new Set([editorRef.current]), providerRef.current.awareness);
    bindingRef.current = binding;
  }, [selectedFileId, monaco, fileSystem, ydocRef, providerRef, setLanguage, onSelectedFileDeleted]);

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      editorRef.current = null;
      ytextRef.current = null;
    };
  }, []);

  return {
    handleEditorDidMount,
    editorRef,
    ytextRef,
  };
};
