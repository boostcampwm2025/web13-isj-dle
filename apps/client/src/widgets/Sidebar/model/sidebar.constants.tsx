import NoticeSidebar from "../ui/panels/NoticeSidebar";
import UserListSidebar from "../ui/panels/UserListSidebar";
import type { SidebarItem, SidebarKey } from "./sidebar.types";

export const SIDEBAR_WIDTH = 350;
export const SIDEBAR_ANIMATION_DURATION = 500;

export const SIDEBAR_MAP: Record<SidebarKey, SidebarItem> = {
  users: {
    title: "👥 사용자 목록",
    icon: <span>👥</span>,
    Panel: <UserListSidebar />,
  },
  notices: {
    title: "📢 공지사항",
    icon: <span>📢</span>,
    Panel: <NoticeSidebar />,
  },
};
