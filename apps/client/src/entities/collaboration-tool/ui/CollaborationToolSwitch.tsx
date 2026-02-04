import { COLLABORATION_TOOL } from "../model/collaboration-tool.constants";
import { type CollaborationToolTab, useCollaborationToolStore } from "../model/collaboration-tool.store";

type CollaborationToolSwitchVariant = "panel" | "modal";

type CollaborationToolSwitchProps = {
  variant?: CollaborationToolSwitchVariant;
  className?: string;
};

const TABS: readonly CollaborationToolTab[] = ["whiteboard", "code-editor"] as const;

const TAB_LABEL: Record<CollaborationToolTab, string> = {
  whiteboard: "화이트보드",
  "code-editor": "코드 에디터",
};

const CollaborationToolSwitch = ({ variant = "panel", className }: CollaborationToolSwitchProps) => {
  const activeTool = useCollaborationToolStore((state) => state.activeTool);
  const openTool = useCollaborationToolStore((state) => state.openTool);

  const activeTab = useCollaborationToolStore((state) => state.activeTab);
  const setActiveTab = useCollaborationToolStore((state) => state.setActiveTab);

  const selectedTab: CollaborationToolTab =
    activeTool === COLLABORATION_TOOL.CODE_EDITOR
      ? "code-editor"
      : activeTool === COLLABORATION_TOOL.WHITEBOARD
        ? "whiteboard"
        : activeTab;

  const handleSelect = (tab: CollaborationToolTab) => {
    if (tab === selectedTab) return;
    if (variant === "modal" || activeTool) {
      openTool(tab === "whiteboard" ? COLLABORATION_TOOL.WHITEBOARD : COLLABORATION_TOOL.CODE_EDITOR);
      return;
    }

    setActiveTab(tab);
  };

  return (
    <div className={`rounded-full bg-gray-100 p-1 ${className ?? ""}`.trim()}>
      <div className="relative flex">
        <div
          className={`absolute top-0 h-full w-1/2 rounded-full bg-white shadow transition-transform duration-200 ${
            selectedTab === "code-editor" ? "translate-x-full" : ""
          }`}
        />
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleSelect(tab)}
            className="relative flex-1 py-1.5 text-sm text-gray-700"
            type="button"
          >
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CollaborationToolSwitch;
