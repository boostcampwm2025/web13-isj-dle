import { COLLABORATION_TOOL, type CollaborationToolType } from "./collaboration-tool.constants";
import { create } from "zustand";

export type CollaborationToolTab = typeof COLLABORATION_TOOL.WHITEBOARD | typeof COLLABORATION_TOOL.CODE_EDITOR;

const getTabByTool = (
  tool: NonNullable<CollaborationToolType>,
  fallback: CollaborationToolTab,
): CollaborationToolTab => {
  if (tool === COLLABORATION_TOOL.WHITEBOARD) return "whiteboard";
  if (tool === COLLABORATION_TOOL.CODE_EDITOR) return "code-editor";
  return fallback;
};

interface CollaborationToolState {
  activeTool: CollaborationToolType;
  activeTab: CollaborationToolTab;
  setActiveTab: (tab: CollaborationToolTab) => void;
  openTool: (tool: NonNullable<CollaborationToolType>) => void;
  closeTool: () => void;
  isToolOpen: (tool: CollaborationToolType) => boolean;
}

export const useCollaborationToolStore = create<CollaborationToolState>((set, get) => ({
  activeTool: null,
  activeTab: "whiteboard",
  setActiveTab: (activeTab) => set({ activeTab }),
  openTool: (tool) =>
    set((state) => ({
      activeTool: tool,
      activeTab: getTabByTool(tool, state.activeTab),
    })),
  closeTool: () => set({ activeTool: null }),
  isToolOpen: (tool) => get().activeTool === tool,
}));
