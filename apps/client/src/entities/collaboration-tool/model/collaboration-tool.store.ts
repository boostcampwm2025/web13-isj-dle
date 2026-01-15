import { type CollaborationToolType } from "./collaboration-tool.constants";
import { create } from "zustand";

interface CollaborationToolState {
  activeTool: CollaborationToolType;
  openTool: (tool: NonNullable<CollaborationToolType>) => void;
  closeTool: () => void;
  isToolOpen: (tool: CollaborationToolType) => boolean;
}

export const useCollaborationToolStore = create<CollaborationToolState>((set, get) => ({
  activeTool: null,
  openTool: (tool) => set({ activeTool: tool }),
  closeTool: () => set({ activeTool: null }),
  isToolOpen: (tool) => get().activeTool === tool,
}));
