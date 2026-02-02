import { SIDEBAR_MAP, TUTORIAL_VIRTUAL_TABS } from "../model/sidebar.constants";
import useSidebarState from "../model/use-sidebar-state";
import { TimerProgressButton } from "./TimerProgressButton";
import { PanelLeft, PanelLeftClose } from "lucide-react";

import { Suspense } from "react";

import { useChatStore } from "@entities/chat";
import { useKnockStore } from "@entities/knock";
import { TUTORIAL_STEPS, useTutorialStore } from "@features/tutorial";
import { ICON_SIZE } from "@shared/config";
import { SIDEBAR_ANIMATION_DURATION, SIDEBAR_CONTENT_WIDTH, SIDEBAR_TAB_WIDTH } from "@shared/config";

const MAX_BADGE_COUNT = 9;

const Sidebar = () => {
  const { sidebarKeys, validCurrentKey, isOpen, handleTabClick, toggleSidebar } = useSidebarState();
  const knockCount = useKnockStore((s) => s.receivedKnocks.length);
  const chatUnreadCount = useChatStore((s) => s.unreadCount);

  const { isActive: isTutorialActive, currentStep } = useTutorialStore();
  const currentStepId = TUTORIAL_STEPS[currentStep]?.id;

  return (
    <div className="fixed top-0 right-0 flex h-full text-black">
      <div
        className="pointer-events-auto absolute top-0 right-0 h-full rounded-l-3xl bg-gray-300 transition-transform ease-in-out"
        style={{
          width: `${SIDEBAR_CONTENT_WIDTH}px`,
          marginRight: `${SIDEBAR_TAB_WIDTH}px`,
          transform: isOpen ? "translateX(0)" : `translateX(calc(100% + ${SIDEBAR_TAB_WIDTH}px))`,
          transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
        }}
      >
        <div className="mx-2 my-2 h-[calc(100%-1rem)] overflow-hidden rounded-2xl bg-white p-4">
          {sidebarKeys.map((key, index) => {
            const isActive = key === validCurrentKey;
            const PanelComponent = SIDEBAR_MAP[key];
            return (
              <div className={`h-full w-full ${isActive ? "block" : "hidden"}`} key={index}>
                <div className="text-xl font-semibold">{PanelComponent.title}</div>
                <hr className="mt-2 mb-4 text-gray-500" />
                <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
                  <Suspense fallback={<div className="p-4 text-gray-400">Loading...</div>}>
                    <PanelComponent.Panel />
                  </Suspense>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        data-sidebar-tabs
        className="pointer-events-auto absolute relative top-0 right-0 flex h-full flex-col bg-gray-300 px-2 py-2"
        style={{ width: `${SIDEBAR_TAB_WIDTH}px` }}
      >
        <button
          className="mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
          onClick={toggleSidebar}
          title={isOpen ? "사이드바 닫기" : "사이드바 열기"}
        >
          {isOpen ? (
            <PanelLeftClose className="h-6 w-6 text-gray-600" />
          ) : (
            <PanelLeft className="h-6 w-6 text-gray-600" />
          )}
        </button>

        <div className="mb-2 h-0.5 w-full bg-gray-400" />

        <div className="relative flex-1">
          <div className="scrollbar-hide flex h-full flex-col gap-4 overflow-y-auto">
            {sidebarKeys.map((key) => {
              const sidebarItem = SIDEBAR_MAP[key];
              if (!sidebarItem) return null;

              const isActive = isOpen && validCurrentKey === key;

              if (key === "timer-stopwatch") {
                return (
                  <TimerProgressButton
                    key={key}
                    sidebarItem={sidebarItem}
                    isActive={isActive}
                    onClick={() => handleTabClick(key)}
                  />
                );
              }

              const IconComponent = sidebarItem.Icon;
              return (
                <button
                  key={key}
                  data-tutorial={`sidebar-${key}`}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => handleTabClick(key)}
                  title={sidebarItem.title}
                >
                  <IconComponent className="h-6 w-6" size={ICON_SIZE} />
                </button>
              );
            })}
          </div>

          {TUTORIAL_VIRTUAL_TABS.map((tab, idx) => {
            const isVisible = isTutorialActive && currentStepId === tab.stepId;
            const IconComponent = tab.icon;
            return (
              <div
                key={tab.stepId}
                data-tutorial={`sidebar-${tab.stepId.replace("sidebar-", "")}`}
                className={`absolute left-0 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 ring-2 ring-blue-400 transition-opacity ${
                  isVisible ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                style={{ top: `${(sidebarKeys.length + idx) * (48 + 16)}px` }}
                title={tab.label}
              >
                <IconComponent className="h-6 w-6 text-blue-600" />
              </div>
            );
          })}

          {sidebarKeys.map((key, index) => {
            let badgeCount = 0;
            if (key === "deskZone" && knockCount > 0) {
              badgeCount = knockCount;
            } else if (key === "chat" && chatUnreadCount > 0) {
              badgeCount = chatUnreadCount;
            }

            if (badgeCount === 0) return null;

            return (
              <span
                key={`badge-${key}`}
                className="pointer-events-none absolute flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white"
                style={{
                  top: `${index * (48 + 16)}px`,
                  right: "-4px",
                }}
              >
                {badgeCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : badgeCount}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
