import ChatSidebar from "../ui/panels/ChatSidebar";
import NoticeSidebar from "../ui/panels/NoticeSidebar";
import UserListSidebar from "../ui/panels/UserListSidebar";
import type { SidebarItem, SidebarKey } from "./sidebar.types";
import { Megaphone, MessageCircleMore, Users } from "lucide-react";

export const SIDEBAR_MAP: Record<SidebarKey, SidebarItem> = {
  users: {
    title: "사용자 목록",
    Icon: Users,
    Panel: UserListSidebar,
  },
  notices: {
    title: "공지사항",
    Icon: Megaphone,
    Panel: NoticeSidebar,
  },
  chat: {
    title: "채팅",
    Icon: MessageCircleMore,
    Panel: ChatSidebar,
  },
};
