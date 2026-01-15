import { COLLABORATION_TOOL } from "../../model/collaboration-tool.constants";
import { useCollaborationToolStore } from "../../model/collaboration-tool.store";

const WhiteboardSidebar = () => {
  const activeTool = useCollaborationToolStore((state) => state.activeTool);
  const openWhiteboard = useCollaborationToolStore((state) => state.openWhiteboard);
  const closeTool = useCollaborationToolStore((state) => state.closeTool);

  const isWhiteboardOpen = activeTool === COLLABORATION_TOOL.WHITEBOARD;

  const handleToggle = () => {
    if (isWhiteboardOpen) {
      closeTool();
    } else {
      openWhiteboard();
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">실시간으로 함께 그리고 아이디어를 공유할 수 있는 협업 화이트보드입니다.</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3">
        <h4 className="text-sm font-medium text-gray-700">주요 기능</h4>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>실시간 드로잉 공유</li>
          <li>다양한 도형 및 텍스트 도구</li>
          <li>참가자 커서 실시간 표시</li>
          <li>작업 내역 저장 및 불러오기</li>
        </ul>
      </div>

      <button
        onClick={handleToggle}
        className={`mt-auto w-full rounded-lg px-4 py-3 font-semibold transition-colors ${
          isWhiteboardOpen ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isWhiteboardOpen ? "화이트보드 닫기" : "화이트보드 열기"}
      </button>

      {isWhiteboardOpen && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-2 text-sm text-green-700">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
          화이트보드가 열려있습니다
        </div>
      )}
    </div>
  );
};

export default WhiteboardSidebar;
