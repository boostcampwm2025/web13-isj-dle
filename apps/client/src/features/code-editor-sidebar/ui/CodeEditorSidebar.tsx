import CodeEditorModal from "./CodeEditorModal";

import { COLLABORATION_TOOL, CollaborationToolSidebar } from "@entities/collaboration-tool";

const CodeEditorSidebar = () => {
  return (
    <CollaborationToolSidebar
      toolType={COLLABORATION_TOOL.CODE_EDITOR}
      title="코드 에디터"
      description="실시간으로 함께 코드를 작성하고 공유할 수 있는 협업 코드 에디터입니다."
      features={[
        "실시간 코드 동기화",
        "다양한 언어 지원 (JS, TS, Python 등)",
        "참가자 커서 실시간 표시",
        "다크/라이트 테마 지원",
      ]}
      buttonColor="purple"
    >
      <CodeEditorModal />
    </CollaborationToolSidebar>
  );
};

export default CodeEditorSidebar;
