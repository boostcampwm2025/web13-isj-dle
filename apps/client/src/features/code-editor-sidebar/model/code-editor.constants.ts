import type * as Monaco from "monaco-editor";

export const EDITOR_THEMES = [
  { value: "vs", label: "Light" },
  { value: "vs-dark", label: "Dark" },
] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number]["value"];

export const getAvailableLanguages = (monaco: typeof Monaco) => {
  const languageIds = new Set<string>();
  const allLanguages = monaco.languages.getLanguages();

  const uniqueLanguages = allLanguages.reduce((acc: { value: string; label: string }[], lang) => {
    if (!languageIds.has(lang.id)) {
      languageIds.add(lang.id);
      acc.push({
        value: lang.id,
        label: lang.aliases?.[0] || lang.id,
      });
    }
    return acc;
  }, []);

  return uniqueLanguages.sort((a, b) => a.label.localeCompare(b.label));
};

export type EditorLanguage = string;

export const DEFAULT_EDITOR_OPTIONS = {
  language: "javascript" as EditorLanguage,
  theme: "vs-dark" as EditorTheme,
};

export const MONACO_EDITOR_OPTIONS = {
  fontSize: 14,
  lineHeight: 21,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: "on" as const,
  padding: { top: 16, bottom: 16 },
} as const;
