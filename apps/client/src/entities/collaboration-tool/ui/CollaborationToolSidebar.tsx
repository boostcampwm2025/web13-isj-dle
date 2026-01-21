import type { CollaborationToolType } from "../model/collaboration-tool.constants";
import { useCollaborationToolStore } from "../model/collaboration-tool.store";

type CollaborationToolSidebarProps = {
  toolType: NonNullable<CollaborationToolType>;
  title: string;
  description: string;
  features: string[];
  buttonColor: "blue" | "purple";
  children?: React.ReactNode;
};

const BUTTON_COLORS = {
  blue: {
    open: "bg-blue-500 hover:bg-blue-600",
    close: "bg-red-500 hover:bg-red-600",
  },
  purple: {
    open: "bg-purple-500 hover:bg-purple-600",
    close: "bg-red-500 hover:bg-red-600",
  },
} as const;

const CollaborationToolSidebar = ({
  toolType,
  title,
  description,
  features,
  buttonColor,
  children,
}: CollaborationToolSidebarProps) => {
  const activeTool = useCollaborationToolStore((state) => state.activeTool);
  const closeTool = useCollaborationToolStore((state) => state.closeTool);
  const openTool = useCollaborationToolStore((state) => state.openTool);

  const isOpen = activeTool === toolType;

  const handleToggle = () => {
    if (isOpen) {
      closeTool();
    } else {
      openTool(toolType);
    }
  };

  const buttonStyles = BUTTON_COLORS[buttonColor];

  return (
    <div className="flex h-full w-full flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3">
        <h4 className="text-sm font-medium text-gray-700">주요 기능</h4>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleToggle}
        className={`mt-auto w-full rounded-lg px-4 py-3 font-semibold text-white transition-colors ${
          isOpen ? buttonStyles.close : buttonStyles.open
        }`}
      >
        {isOpen ? `${title} 닫기` : `${title} 열기`}
      </button>

      {isOpen && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-2 text-sm text-green-700">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
          {title}가 열려있습니다
        </div>
      )}

      {children}
    </div>
  );
};

export default CollaborationToolSidebar;
