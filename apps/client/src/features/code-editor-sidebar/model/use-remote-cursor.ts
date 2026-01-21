import type * as Monaco from "monaco-editor";
import type { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

import { type RefObject, useEffect, useState } from "react";

type Awareness = WebsocketProvider["awareness"];

interface UseRemoteCursorOptions {
  isInitialized: boolean;
  editorRef: RefObject<Monaco.editor.IStandaloneCodeEditor | null>;
  awarenessRef: RefObject<Awareness | null>;
  ytextRef: RefObject<Y.Text | null>;
  selectedFileId: string | null;
}

export const useRemoteCursor = ({
  isInitialized,
  editorRef,
  awarenessRef,
  ytextRef,
  selectedFileId,
}: UseRemoteCursorOptions) => {
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
  }, [isInitialized, editorRef, awarenessRef, ytextRef, selectedFileId]);

  return { remoteCursorData };
};
