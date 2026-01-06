import { SIDEBAR_ANIMATION_DURATION, SIDEBAR_MAP, SIDEBAR_WIDTH } from "../model/sidebar.constants";
import useSidebarState from "../model/use-sidebar-state";

const Sidebar = () => {
  const { sidebarKeys, validCurrentKey, isOpen, currentPanel, handleTabClick, toggleSidebar } = useSidebarState();

  return (
    <div className="relative flex h-full">
      <div
        className="pointer-events-auto absolute flex h-full flex-row gap-2 rounded-r-3xl border-r border-gray-200 bg-gray-300 transition-transform ease-in-out"
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          transform: isOpen ? "translateX(0)" : `translateX(-${SIDEBAR_WIDTH}px)`,
          transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
        }}
      >
        <div className="scrollbar-hide my-2 ml-2 flex w-12 shrink-0 flex-col gap-4 overflow-y-auto">
          {sidebarKeys.map((key) => {
            const { icon } = SIDEBAR_MAP[key];
            return (
              <button
                key={key}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  validCurrentKey === key ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => handleTabClick(key)}
              >
                {icon}
              </button>
            );
          })}
        </div>
        <div className="w-0.5 shrink-0 bg-gray-400" />
        <div className="my-2 mr-2 grow overflow-hidden rounded-2xl bg-white p-4">
          {currentPanel ? (
            <div className="h-full w-full">
              <div className="text-xl font-semibold">{currentPanel.title}</div>
              <hr className="my-2" />
              <div className="h-[calc(100%-2.5rem)] overflow-y-auto">{currentPanel.Panel}</div>
            </div>
          ) : (
            <div className="text-gray-400">Select a panel</div>
          )}
        </div>
      </div>

      <button
        className="pointer-events-auto absolute top-0 translate-y-1/2 rounded-r-full bg-gray-300 p-2 shadow-lg transition-transform ease-in-out hover:bg-gray-400"
        style={{
          left: `${SIDEBAR_WIDTH}px`,
          transform: isOpen ? "translateX(0)" : `translateX(-${SIDEBAR_WIDTH}px)`,
          transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
        }}
        onClick={toggleSidebar}
        aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
      >
        <svg
          className="h-5 w-5 transition-transform"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Sidebar;
