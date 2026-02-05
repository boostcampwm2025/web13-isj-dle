import { useMemo, useState } from "react";

import { useMonaco } from "@monaco-editor/react";

import { DEFAULT_EDITOR_OPTIONS, type EditorTheme, getAvailableLanguages } from "./code-editor.constants";

export const useCodeEditor = () => {
  const monaco = useMonaco();
  const [theme, setTheme] = useState<EditorTheme>(DEFAULT_EDITOR_OPTIONS.theme);
  const [showExplorer, setShowExplorer] = useState(true);

  const availableLanguages = useMemo(() => {
    if (monaco) {
      return getAvailableLanguages(monaco);
    }
    return [];
  }, [monaco]);

  return {
    monaco,
    theme,
    setTheme,
    availableLanguages,
    showExplorer,
    setShowExplorer,
  };
};
