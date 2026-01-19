import type { SidebarKey } from "@shared/config";

export const COLLABORATION_TOOL = {
  WHITEBOARD: "whiteboard",
  CODE_EDITOR: "code-editor",
  TIMER_STOPWATCH: "timer-stopwatch",
} as const;

export type CollaborationToolType = (typeof COLLABORATION_TOOL)[keyof typeof COLLABORATION_TOOL] | null;

export const COLLABORATION_SIDEBAR_KEYS: readonly SidebarKey[] = [
  COLLABORATION_TOOL.WHITEBOARD,
  COLLABORATION_TOOL.CODE_EDITOR,
] as const;

export const TIMER_STOPWATCH_SIDEBAR_KEY: SidebarKey = COLLABORATION_TOOL.TIMER_STOPWATCH;
