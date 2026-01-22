import { SIDEBAR_MAP } from "./sidebar.constants";
import { useSidebarStore } from "./sidebar.store";

import { useMemo } from "react";

import { useChatStore } from "@entities/chat";
import type { SidebarKey } from "@shared/config";

const useSidebarState = () => {
  const sidebarKeys = useSidebarStore((s) => s.sidebarKeys);
  const isOpen = useSidebarStore((s) => s.isOpen);
  const currentKey = useSidebarStore((s) => s.currentKey);
  const setCurrentKey = useSidebarStore((s) => s.setCurrentKey);
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);
  const openSidebarWithLastKey = useSidebarStore((s) => s.openSidebarWithLastKey);
  const resetChatUnreadCount = useChatStore((s) => s.resetUnreadCount);

  const lastOpenedKey = useSidebarStore((s) => s.lastOpenedKey);

  const validCurrentKey = useMemo(() => {
    if (currentKey && sidebarKeys.includes(currentKey)) {
      return currentKey;
    }

    if (lastOpenedKey && sidebarKeys.includes(lastOpenedKey)) {
      return lastOpenedKey;
    }
    return sidebarKeys[0] || null;
  }, [currentKey, sidebarKeys, lastOpenedKey]);

  const setIsOpen = useSidebarStore((s) => s.setIsOpen);

  const handleTabClick = (key: SidebarKey) => {
    setCurrentKey(key);
    if (!isOpen) {
      setIsOpen(true);
    }
    if (key === "chat") {
      resetChatUnreadCount();
    }
  };
  const currentPanel = validCurrentKey ? SIDEBAR_MAP[validCurrentKey] : null;

  return { sidebarKeys, validCurrentKey, isOpen, currentPanel, handleTabClick, toggleSidebar, openSidebarWithLastKey };
};

export default useSidebarState;
