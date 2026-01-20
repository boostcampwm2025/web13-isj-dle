import { Code, Megaphone, MessageCircleMore, PenTool, Timer, Users } from "lucide-react";

import { lazy } from "react";

import { ChatSidebar } from "@features/chat-sidebar";
import { CodeEditorSidebar } from "@features/code-editor-sidebar";
import { NoticeSidebar } from "@features/notice-sidebar";
import { UserListSidebar } from "@features/user-list-sidebar";
import { WhiteboardSidebar } from "@features/whiteboard-sidebar";
import type { SidebarItem, SidebarKey } from "@shared/config";

const TimerStopwatchSidebar = lazy(() =>
  import("@features/timer-stopwatch-sidebar").then((m) => ({ default: m.TimerStopwatchSidebar })),
);

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
  "timer-stopwatch": {
    title: "타이머/스톱워치",
    Icon: Timer,
    Panel: TimerStopwatchSidebar,
  },
  chat: {
    title: "채팅",
    Icon: MessageCircleMore,
    Panel: ChatSidebar,
  },
};
