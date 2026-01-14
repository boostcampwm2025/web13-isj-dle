import { SIDEBAR_MAP } from "../model/sidebar.constants";
import useSidebarState from "../model/use-sidebar-state";
import { PanelLeft, PanelLeftClose } from "lucide-react";

import { SIDEBAR_ANIMATION_DURATION, SIDEBAR_CONTENT_WIDTH, SIDEBAR_TAB_WIDTH } from "@shared/config";

const Sidebar = () => {
  const { sidebarKeys, validCurrentKey, isOpen, currentPanel, handleTabClick, toggleSidebar } = useSidebarState();

  return (
    <div className="fixed top-0 right-0 flex h-full text-black">
      {/* 1. 콘텐츠 패널 (슬라이드) */}
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
              <hr className="my-2 text-gray-500" />
              <div className="h-[calc(100%-2.5rem)] overflow-y-auto">{currentPanel.Panel}</div>
            </div>
          ) : (
            <div className="text-gray-400">Select a panel</div>
          )}
        </div>
      </div>

      {/* 2. 탭 버튼 영역 (항상 고정) */}
      <div
        className="pointer-events-auto absolute top-0 right-0 flex h-full flex-col bg-gray-300 px-2 py-2"
        style={{ width: `${SIDEBAR_TAB_WIDTH}px` }}
      >
        {/* 사이드바 토글 버튼 (탭 버튼 위) */}
        <button
          className="mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
          onClick={toggleSidebar}
          aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
        >
          {isOpen ? (
            <PanelLeftClose className="h-6 w-6 text-gray-600" />
          ) : (
            <PanelLeft className="h-6 w-6 text-gray-600" />
          )}
        </button>

        {/* 구분선 */}
        <div className="mb-2 h-0.5 w-full bg-gray-400" />

        {/* 탭 버튼들 */}
        <div className="scrollbar-hide flex flex-col gap-4 overflow-y-auto">
          {sidebarKeys.map((key) => {
            const { icon } = SIDEBAR_MAP[key];
            return (
              <button
                key={key}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isOpen && validCurrentKey === key ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => handleTabClick(key)}
              >
                {icon}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
