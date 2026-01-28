import { useEffect, useRef } from "react";

import { COLLABORATION_TOOL, CollaborationToolSwitch, useCollaborationToolStore } from "@entities/collaboration-tool";
import { useUserStore } from "@entities/user";
import { CodeEditorSidebar } from "@features/code-editor-sidebar";
import { WhiteboardSidebar } from "@features/whiteboard-sidebar";

const CollaborationToolsSidebar = () => {
  const closeTool = useCollaborationToolStore((state) => state.closeTool);
  const activeTab = useCollaborationToolStore((state) => state.activeTab);
  const setActiveTab = useCollaborationToolStore((state) => state.setActiveTab);

  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId ?? null);
  const prevRoomIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const prevRoomId = prevRoomIdRef.current;
    if (prevRoomId === undefined) {
      prevRoomIdRef.current = currentRoomId;
      return;
    }

    if (prevRoomId !== currentRoomId) {
      setActiveTab("whiteboard");
      closeTool();
    }

    prevRoomIdRef.current = currentRoomId;
  }, [closeTool, currentRoomId, setActiveTab]);

  return (
    <div className="flex h-full w-full flex-col">
      <CollaborationToolSwitch className="mb-4" variant="panel" />

      <div className="min-h-0 flex-1">
        <div className={activeTab === COLLABORATION_TOOL.WHITEBOARD ? "h-full" : "hidden"}>
          <WhiteboardSidebar />
        </div>
        <div className={activeTab === COLLABORATION_TOOL.CODE_EDITOR ? "h-full" : "hidden"}>
          <CodeEditorSidebar />
        </div>
      </div>
    </div>
  );
};

export default CollaborationToolsSidebar;
