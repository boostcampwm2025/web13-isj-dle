import { COLLABORATION_TOOL, type CollaborationToolType } from "./collaboration-tool.constants";
import { create } from "zustand";

interface CollaborationToolState {
  activeTool: CollaborationToolType;

  openWhiteboard: () => void;

  openCodeEditor: () => void;

  closeTool: () => void;

  isToolOpen: (tool: CollaborationToolType) => boolean;
}

export const useCollaborationToolStore = create<CollaborationToolState>((set, get) => ({
  activeTool: null,

  openWhiteboard: () => set({ activeTool: COLLABORATION_TOOL.WHITEBOARD }),

  openCodeEditor: () => set({ activeTool: COLLABORATION_TOOL.CODE_EDITOR }),

  closeTool: () => set({ activeTool: null }),

  isToolOpen: (tool) => get().activeTool === tool,
}));
