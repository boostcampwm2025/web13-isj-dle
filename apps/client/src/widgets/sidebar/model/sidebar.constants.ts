import {
  Blocks,
  BookOpen,
  Briefcase,
  Code,
  Crown,
  Images,
  Megaphone,
  MessageCircleMore,
  PenTool,
  Presentation,
  Timer,
  Users,
} from "lucide-react";

import { lazy } from "react";

import { ChatSidebar } from "@features/chat-sidebar";
import { CodeEditorSidebar } from "@features/code-editor-sidebar";
import { DeskZoneSidebar } from "@features/desk-zone-sidebar";
import { GuideSidebar } from "@features/guide-sidebar";
import { HostSidebar, ParticipantSidebar } from "@features/host-sidebar";
import { MeetingSidebar } from "@features/meeting-sidebar";
import { NoticeSidebar } from "@features/notice-sidebar";
import { RestaurantSidebar } from "@features/restaurant-sidebar";
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
  guide: {
    title: "이용 가이드",
    Icon: BookOpen,
    Panel: GuideSidebar,
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
  deskZone: {
    title: "데스크존",
    Icon: Briefcase,
    Panel: DeskZoneSidebar,
  },
  host: {
    title: "관리자",
    Icon: Crown,
    Panel: HostSidebar,
  },
  participant: {
    title: "조별 활동",
    Icon: Blocks,
    Panel: ParticipantSidebar,
  },
  restaurant: {
    title: "식당",
    Icon: Images,
    Panel: RestaurantSidebar,
  meeting: {
    title: "회의실",
    Icon: Presentation,
    Panel: MeetingSidebar,
  },
};
