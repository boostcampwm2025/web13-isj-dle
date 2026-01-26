import {
  Blocks,
  BookOpen,
  Briefcase,
  Crown,
  Megaphone,
  MessageCircleMore,
  PanelsTopLeft,
  Timer,
  Users,
} from "lucide-react";

import { lazy } from "react";

import { ChatSidebar } from "@features/chat-sidebar";
import { CollaborationToolsSidebar } from "@features/collaboration-tool-sidebar";
import { DeskZoneSidebar } from "@features/desk-zone-sidebar";
import { GuideSidebar } from "@features/guide-sidebar";
import { HostSidebar, ParticipantSidebar } from "@features/host-sidebar";
import { NoticeSidebar } from "@features/notice-sidebar";
import { UserListSidebar } from "@features/user-list-sidebar";
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
  "collaboration-tool": {
    title: "협업 도구",
    Icon: PanelsTopLeft,
    Panel: CollaborationToolsSidebar,
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
};
