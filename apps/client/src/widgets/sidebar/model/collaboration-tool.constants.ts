import type { SidebarKey } from "./sidebar.types";

export const COLLABORATION_TOOL = {
  WHITEBOARD: "whiteboard",
  CODE_EDITOR: "code-editor",
} as const;

export type CollaborationToolType = (typeof COLLABORATION_TOOL)[keyof typeof COLLABORATION_TOOL] | null;

export const COLLABORATION_SIDEBAR_KEYS: readonly SidebarKey[] = [
  COLLABORATION_TOOL.WHITEBOARD,
  COLLABORATION_TOOL.CODE_EDITOR,
] as const;
