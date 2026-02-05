import { type RefObject, memo, useLayoutEffect, useRef, useState } from "react";

import type { SidebarKey } from "@shared/config";
import { ICON_SIZE } from "@shared/config";

import { SIDEBAR_MAP } from "../model/sidebar.constants";
import { TimerProgressButton } from "./TimerProgressButton";

interface SidebarTabButtonProps {
  tabKey: SidebarKey;
  isActive: boolean;
  isNewlyAdded: boolean;
  onClick: () => void;
}

interface TooltipProps {
  title: string;
  isVisible: boolean;
  buttonRef: RefObject<HTMLDivElement | null>;
}

const Tooltip = ({ title, isVisible, buttonRef }: TooltipProps) => {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.top + rect.height / 2,
        right: window.innerWidth - rect.left + 8,
      });
    } else {
      setPos(null);
    }
  }, [isVisible, buttonRef]);

  if (!isVisible || !pos) return null;

  return (
    <div
      className="pointer-events-none fixed -translate-y-1/2 rounded-md bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white after:absolute after:top-1/2 after:left-full after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-gray-800"
      style={{ top: pos.top, right: pos.right }}
    >
      {title}
    </div>
  );
};

export const SidebarTabButton = memo(function SidebarTabButton({
  tabKey,
  isActive,
  isNewlyAdded,
  onClick,
}: SidebarTabButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const sidebarItem = SIDEBAR_MAP[tabKey];

  if (!sidebarItem) return null;

  if (tabKey === "timer-stopwatch") {
    return (
      <div
        ref={buttonRef}
        data-tutorial={`sidebar-${tabKey}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <TimerProgressButton
          sidebarItem={sidebarItem}
          isActive={isActive}
          isNewlyAdded={isNewlyAdded}
          onClick={onClick}
        />
        <Tooltip title={sidebarItem.title} isVisible={isHovered} buttonRef={buttonRef} />
      </div>
    );
  }

  const IconComponent = sidebarItem.Icon;

  return (
    <div
      ref={buttonRef}
      data-tutorial={`sidebar-${tabKey}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
          isActive ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
        } ${isNewlyAdded ? "animate-sidebar-tab-enter" : ""}`}
        onClick={onClick}
      >
        <IconComponent className="h-6 w-6" size={ICON_SIZE} />
      </button>
      <Tooltip title={sidebarItem.title} isVisible={isHovered} buttonRef={buttonRef} />
    </div>
  );
});
