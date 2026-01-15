import { COLLABORATION_TOOL } from "../../model/collaboration-tool.constants";
import { useCollaborationToolStore } from "../../model/collaboration-tool.store";

const CodeEditorSidebar = () => {
  const activeTool = useCollaborationToolStore((state) => state.activeTool);
  const openCodeEditor = useCollaborationToolStore((state) => state.openCodeEditor);
  const closeTool = useCollaborationToolStore((state) => state.closeTool);

  const isCodeEditorOpen = activeTool === COLLABORATION_TOOL.CODE_EDITOR;

  const handleToggle = () => {
    if (isCodeEditorOpen) {
      closeTool();
    } else {
      openCodeEditor();
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">실시간으로 함께 코드를 작성하고 공유할 수 있는 협업 코드 에디터입니다.</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3">
        <h4 className="text-sm font-medium text-gray-700">주요 기능</h4>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>실시간 코드 동기화</li>
          <li>html, css, js, ts 지원</li>
          <li>참가자 커서 실시간 표시</li>
          <li>코드 실행 및 결과 공유</li>
        </ul>
      </div>

      <button
        onClick={handleToggle}
        className={`mt-auto w-full rounded-lg px-4 py-3 font-semibold transition-colors ${
          isCodeEditorOpen ? "bg-red-500 text-white hover:bg-red-600" : "bg-purple-500 text-white hover:bg-purple-600"
        }`}
      >
        {isCodeEditorOpen ? "코드 에디터 닫기" : "코드 에디터 열기"}
      </button>

      {isCodeEditorOpen && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-2 text-sm text-green-700">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
          코드 에디터가 열려있습니다
        </div>
      )}
    </div>
  );
};

export default CodeEditorSidebar;
