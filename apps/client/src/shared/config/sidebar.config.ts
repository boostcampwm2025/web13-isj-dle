import type { LucideIcon } from "lucide-react";

import type { ComponentType } from "react";

export type SidebarKey =
  | "users"
  | "spaceMove"
  | "guide"
  | "collaboration-tool"
  | "timer-stopwatch"
  | "chat"
  | "deskZone"
  | "host"
  | "participant"
  | "restaurant"
  | "meeting";

export const SIDEBAR_KEY_ORDER: Record<SidebarKey, number> = {
  users: 0,
  spaceMove: 1,
  guide: 2,
  chat: 3,
  "collaboration-tool": 4,
  "timer-stopwatch": 5,
  participant: 6,
  host: 7,
  deskZone: 8,
  restaurant: 9,
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
