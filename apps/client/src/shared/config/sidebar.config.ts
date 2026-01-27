import type { LucideIcon } from "lucide-react";

import type { ComponentType } from "react";

export type SidebarKey =
  | "users"
  | "notices"
  | "guide"
  | "whiteboard"
  | "code-editor"
  | "timer-stopwatch"
  | "chat"
  | "deskZone"
  | "host"
  | "participant"
  | "restaurant"
  | "meeting";

export const SIDEBAR_KEY_ORDER: Record<SidebarKey, number> = {
  users: 0,
  notices: 1,
  guide: 2,
  chat: 3,
  "code-editor": 4,
  whiteboard: 5,
  "timer-stopwatch": 6,
  participant: 7,
  host: 8,
  deskZone: 9,
  restaurant: 11,
  meeting: 10,
};

export type SidebarItem = {
  title: string;
  Icon: LucideIcon;
  Panel: ComponentType;
};

export const SIDEBAR_WIDTH = 350;
export const SIDEBAR_TAB_WIDTH = 64;
export const SIDEBAR_CONTENT_WIDTH = SIDEBAR_WIDTH - SIDEBAR_TAB_WIDTH;
export const SIDEBAR_ANIMATION_DURATION = 500;
