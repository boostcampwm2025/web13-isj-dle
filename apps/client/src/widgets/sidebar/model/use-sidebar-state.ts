import { SIDEBAR_MAP } from "./sidebar.constants";
import { useSidebarStore } from "./sidebar.store";
import type { SidebarKey } from "./sidebar.types";

import { useMemo } from "react";

const useSidebarState = () => {
  const sidebarKeys = useSidebarStore((s) => s.sidebarKeys);
  const isOpen = useSidebarStore((s) => s.isOpen);
  const currentKey = useSidebarStore((s) => s.currentKey);
  const setCurrentKey = useSidebarStore((s) => s.setCurrentKey);
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);

  const validCurrentKey = useMemo(() => {
    if (currentKey && sidebarKeys.includes(currentKey)) {
      return currentKey;
    }
    return sidebarKeys[0] || null;
  }, [currentKey, sidebarKeys]);

  const setIsOpen = useSidebarStore((s) => s.setIsOpen);

  const handleTabClick = (key: SidebarKey) => {
    if (!isOpen) {
      setIsOpen(true);
    }
    setCurrentKey(key);
  };
  const currentPanel = validCurrentKey ? SIDEBAR_MAP[validCurrentKey] : null;

  return { sidebarKeys, validCurrentKey, isOpen, currentPanel, handleTabClick, toggleSidebar };
};

export default useSidebarState;
