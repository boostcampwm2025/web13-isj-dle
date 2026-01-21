import type { LucideIcon } from "lucide-react";

import type { ComponentType } from "react";

export type SidebarKey = "users" | "notices" | "chat" | "whiteboard" | "code-editor" | "timer-stopwatch" | "deskZone" | "host";

export type SidebarItem = {
  title: string;
  Icon: LucideIcon;
  Panel: ComponentType;
};

export const SIDEBAR_WIDTH = 350;
export const SIDEBAR_TAB_WIDTH = 64;
export const SIDEBAR_CONTENT_WIDTH = SIDEBAR_WIDTH - SIDEBAR_TAB_WIDTH;
export const SIDEBAR_ANIMATION_DURATION = 500;
