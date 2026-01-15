import ChatSidebar from "../ui/panels/ChatSidebar";
import CodeEditorSidebar from "../ui/panels/CodeEditorSidebar";
import NoticeSidebar from "../ui/panels/NoticeSidebar";
import UserListSidebar from "../ui/panels/UserListSidebar";
import WhiteboardSidebar from "../ui/panels/WhiteboardSidebar";
import type { SidebarItem, SidebarKey } from "./sidebar.types";
import { Code, Megaphone, MessageCircleMore, PenTool, Users } from "lucide-react";

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

  whiteboard: {
    title: "화이트보드",
    Icon: PenTool,
    Panel: WhiteboardSidebar,
  },
  "code-editor": {
    title: "코드 에디터",
    Icon: Code,
    Panel: CodeEditorSidebar,
  },
  chat: {
    title: "채팅",
    Icon: MessageCircleMore,
    Panel: ChatSidebar,
  },
};
