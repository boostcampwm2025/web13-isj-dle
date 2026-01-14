import { SIDEBAR_MAP } from "./sidebar.constants";
import type { SidebarKey } from "./sidebar.types";
import { useSidebar } from "./use-sidebar";

import { useMemo } from "react";

const useSidebarState = () => {
  const { sidebarKeys, isOpen, currentKey, setCurrentKey, toggleSidebar } = useSidebar();

  const validCurrentKey = useMemo(() => {
    if (currentKey && sidebarKeys.includes(currentKey)) {
      return currentKey;
    }
    return sidebarKeys[0] || null;
  }, [currentKey, sidebarKeys]);

  const handleTabClick = (key: SidebarKey) => setCurrentKey(key);
  const currentPanel = validCurrentKey ? SIDEBAR_MAP[validCurrentKey] : null;

  return { sidebarKeys, validCurrentKey, isOpen, currentPanel, handleTabClick, toggleSidebar };
};

export default useSidebarState;
