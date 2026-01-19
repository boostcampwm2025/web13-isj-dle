import { EDITOR_THEMES, type EditorLanguage, type EditorTheme } from "../model/code-editor.constants";

interface LanguageOption {
  value: string;
  label: string;
}

interface CodeEditorControlsProps {
  language: EditorLanguage;
  theme: EditorTheme;
  availableLanguages: LanguageOption[];
  isConnected: boolean;
  onLanguageChange: (language: EditorLanguage) => void;
  onThemeChange: (theme: EditorTheme) => void;
}

const CodeEditorControls = ({
  language,
  theme,
  availableLanguages,
  isConnected,
  onLanguageChange,
  onThemeChange,
}: CodeEditorControlsProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="language-select" className="text-sm text-gray-600">
          언어:
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as EditorLanguage)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          disabled={!availableLanguages.length}
        >
          {availableLanguages.length > 0 ? (
            availableLanguages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))
          ) : (
            <option>불러오는 중...</option>
          )}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="theme-select" className="text-sm text-gray-600">
          테마:
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => onThemeChange(e.target.value as EditorTheme)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          {EDITOR_THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          title={isConnected ? "연결됨" : "연결 끊김"}
        />
      </div>
    </div>
  );
};

export default CodeEditorControls;
