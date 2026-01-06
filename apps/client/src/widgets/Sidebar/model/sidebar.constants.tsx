import type { SidebarItem, SidebarKey } from "./sidebar.types";

export const SIDEBAR_WIDTH = 350;
export const SIDEBAR_ANIMATION_DURATION = 500;

export const SIDEBAR_MAP: Record<SidebarKey, SidebarItem> = {
  users: {
    title: "👥 User List",
    icon: <span>👥</span>,
    Panel: <div>유저 목록</div>,
  },
};
