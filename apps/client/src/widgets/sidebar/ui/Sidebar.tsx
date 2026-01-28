import { SIDEBAR_MAP } from "../model/sidebar.constants";
import useSidebarState from "../model/use-sidebar-state";
import { TimerProgressButton } from "./TimerProgressButton";
import { PanelLeft, PanelLeftClose } from "lucide-react";

import { Suspense } from "react";

import { useChatStore } from "@entities/chat";
import { useKnockStore } from "@entities/knock";
import { ICON_SIZE } from "@shared/config";
import { SIDEBAR_ANIMATION_DURATION, SIDEBAR_CONTENT_WIDTH, SIDEBAR_TAB_WIDTH } from "@shared/config";

const MAX_BADGE_COUNT = 9;

const Sidebar = () => {
  const { sidebarKeys, validCurrentKey, isOpen, currentPanel, handleTabClick, toggleSidebar } = useSidebarState();
  const knockCount = useKnockStore((s) => s.receivedKnocks.length);
  const chatUnreadCount = useChatStore((s) => s.unreadCount);

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
          {currentPanel ? (
            <div className="h-full w-full">
              <div className="text-xl font-semibold">{currentPanel.title}</div>
              <hr className="mt-2 mb-4 text-gray-500" />
              <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
                {(() => {
                  const CollaborationPanel = SIDEBAR_MAP["collaboration-tool"]?.Panel;
                  const hasCollaborationTool = sidebarKeys.includes("collaboration-tool") && CollaborationPanel;
                  return (
                    <>
                      {hasCollaborationTool && (
                        <div className={validCurrentKey === "collaboration-tool" ? "h-full" : "hidden"}>
                          <Suspense fallback={<div className="p-4 text-gray-400">Loading...</div>}>
                            <CollaborationPanel />
                          </Suspense>
                        </div>
                      )}
                      {validCurrentKey !== "collaboration-tool" && (
                        <Suspense fallback={<div className="p-4 text-gray-400">Loading...</div>}>
                          <currentPanel.Panel />
                        </Suspense>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Select a panel</div>
          )}
        </div>
      </div>

      <div
        className="pointer-events-auto absolute top-0 right-0 flex h-full flex-col bg-gray-300 px-2 py-2"
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

          {/* 배지를 overflow 컨테이너 밖에 별도로 렌더링 */}
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
