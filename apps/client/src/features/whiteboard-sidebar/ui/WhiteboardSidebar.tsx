import { COLLABORATION_TOOL, CollaborationToolSidebar } from "@entities/collaboration-tool";

import WhiteboardModal from "./WhiteboardModal";

const WhiteboardSidebar = () => {
  return (
    <CollaborationToolSidebar
      toolType={COLLABORATION_TOOL.WHITEBOARD}
      title="화이트보드"
      description="실시간으로 함께 그리고 아이디어를 공유할 수 있는 협업 화이트보드입니다."
      features={[
        "실시간 드로잉 공유",
        "다양한 도형 및 텍스트 도구",
        "참가자 커서 실시간 표시",
        "작업 내역 저장 및 불러오기",
      ]}
      buttonColor="blue"
    >
      <WhiteboardModal />
    </CollaborationToolSidebar>
  );
};

export default WhiteboardSidebar;
