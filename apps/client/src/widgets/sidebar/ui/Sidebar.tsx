import { SIDEBAR_MAP, TUTORIAL_VIRTUAL_TABS } from "../model/sidebar.constants";
import useSidebarState from "../model/use-sidebar-state";
import { SidebarTabBadge } from "./SidebarTabBadge";
import { SidebarTabButton } from "./SidebarTabButton";
import { PanelLeft, PanelLeftClose } from "lucide-react";

import { Suspense, memo, useEffect, useRef, useState } from "react";

import { useChatStore } from "@entities/chat";
import { useKnockStore } from "@entities/knock";
import { TUTORIAL_STEPS, useTutorialStore } from "@features/tutorial";
import {
  SIDEBAR_ANIMATION_DURATION,
  SIDEBAR_CONTENT_WIDTH,
  SIDEBAR_TAB_ANIMATION_DURATION,
  SIDEBAR_TAB_WIDTH,
} from "@shared/config";
import type { SidebarKey } from "@shared/config";

const Sidebar = () => {
  const { sidebarKeys, validCurrentKey, isOpen, handleTabClick, toggleSidebar } = useSidebarState();
  const knockCount = useKnockStore((s) => s.receivedKnocks.length);
  const chatUnreadCount = useChatStore((s) => s.unreadCount);

  const { isActive: isTutorialActive, currentStep } = useTutorialStore();
  const currentStepId = TUTORIAL_STEPS[currentStep]?.id;
  const prevKeysRef = useRef<SidebarKey[]>(sidebarKeys);
  const [newlyAddedKeys, setNewlyAddedKeys] = useState<Set<SidebarKey>>(new Set());

  useEffect(() => {
    const prevKeys = new Set(prevKeysRef.current);
    const addedKeys = sidebarKeys.filter((key) => !prevKeys.has(key) && !newlyAddedKeys.has(key));

    prevKeysRef.current = sidebarKeys;

    if (addedKeys.length === 0) return;

    setNewlyAddedKeys((prev) => new Set([...prev, ...addedKeys]));

    const timer = setTimeout(() => {
      setNewlyAddedKeys((prev) => {
        const next = new Set(prev);
        for (const key of addedKeys) {
          next.delete(key);
        }
        return next;
      });
    }, SIDEBAR_TAB_ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [sidebarKeys, newlyAddedKeys]);

  const getBadgeCount = (key: SidebarKey): number => {
    if (key === "deskZone") return knockCount;
    if (key === "chat") return chatUnreadCount;
    return 0;
  };

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
        className="pointer-events-auto absolute top-0 right-0 flex h-full flex-col bg-gray-300 px-2 py-2"
        style={{ width: `${SIDEBAR_TAB_WIDTH}px` }}
      >
        <div className="absolute inset-0 bg-gray-300" />

        <div className="group relative z-10 mb-2">
          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
            onClick={toggleSidebar}
          >
            {isOpen ? (
              <PanelLeftClose className="h-6 w-6 text-gray-600" />
            ) : (
              <PanelLeft className="h-6 w-6 text-gray-600" />
            )}
          </button>
          <div className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded-md bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 after:absolute after:top-1/2 after:left-full after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-800">
            {isOpen ? "사이드바 닫기" : "사이드바 열기"}
          </div>
        </div>

        <div className="relative z-10 mb-2 h-0.5 w-full bg-gray-400" />

        <div className="relative z-10 flex-1">
          <div className="scrollbar-hide flex h-full flex-col gap-4 overflow-y-auto">
            {sidebarKeys.map((key) => (
              <SidebarTabButton
                key={key}
                tabKey={key}
                isActive={isOpen && validCurrentKey === key}
                isNewlyAdded={newlyAddedKeys.has(key)}
                onClick={() => handleTabClick(key)}
              />
            ))}
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

          {sidebarKeys.map((key, index) => (
            <SidebarTabBadge key={`badge-${key}`} count={getBadgeCount(key)} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(Sidebar);
