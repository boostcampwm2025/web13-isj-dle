import {
  Blocks,
  BookOpen,
  Briefcase,
  Compass,
  Crown,
  Images,
  MessageCircleMore,
  PanelsTopLeft,
  Presentation,
  Timer,
  Users,
} from "lucide-react";

import { lazy } from "react";

import { ChatSidebar } from "@features/chat-sidebar";
import { CollaborationToolsSidebar } from "@features/collaboration-tool-sidebar";
import { DeskZoneSidebar } from "@features/desk-zone-sidebar";
import { GuideSidebar } from "@features/guide-sidebar";
import { HostSidebar, ParticipantSidebar } from "@features/host-sidebar";
import { MeetingSidebar } from "@features/meeting-sidebar";
import { RestaurantSidebar } from "@features/restaurant-sidebar";
import { SpaceMoveSidebar } from "@features/space-move-sidebar";
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
  spaceMove: {
    title: "공간 자동 이동",
    Icon: Compass,
    Panel: SpaceMoveSidebar,
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
  restaurant: {
    title: "식당",
    Icon: Images,
    Panel: RestaurantSidebar,
  },
  meeting: {
    title: "회의실",
    Icon: Presentation,
    Panel: MeetingSidebar,
  },
};

export const TUTORIAL_VIRTUAL_TABS = [
  { stepId: "sidebar-collaboration-tool", icon: PanelsTopLeft, label: "협업 도구" },
  { stepId: "sidebar-timer-stopwatch", icon: Timer, label: "타이머/스톱워치" },
  { stepId: "sidebar-chat", icon: MessageCircleMore, label: "채팅" },
  { stepId: "sidebar-deskZone", icon: Briefcase, label: "데스크존 노크" },
  { stepId: "sidebar-host", icon: Crown, label: "호스트 관리" },
  { stepId: "sidebar-restaurant", icon: Images, label: "식당 이미지" },
];
