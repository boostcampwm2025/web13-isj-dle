import { COLLABORATION_TOOL } from "../../model/collaboration-tool.constants";
import CollaborationToolSidebar from "./CollaborationToolSidebar";

const CodeEditorSidebar = () => {
  return (
    <CollaborationToolSidebar
      toolType={COLLABORATION_TOOL.CODE_EDITOR}
      title="코드 에디터"
      description="실시간으로 함께 코드를 작성하고 공유할 수 있는 협업 코드 에디터입니다."
      features={["실시간 코드 동기화", "html, css, js, ts 지원", "참가자 커서 실시간 표시", "코드 실행 및 결과 공유"]}
      buttonColor="purple"
    />
  );
};

export default CodeEditorSidebar;
