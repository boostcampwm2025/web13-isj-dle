import { useEffect, useMemo } from "react";

import { useChatStore } from "@entities/chat";
import { useRestaurantImageViewStore } from "@entities/restaurant-image";
import type { SidebarKey } from "@shared/config";

import { useSidebarStore } from "./sidebar.store";

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

  const isUploadRequested = useRestaurantImageViewStore((s) => s.isUploadRequested);

  useEffect(() => {
    if (isUploadRequested) {
      setCurrentKey("restaurant");
      setIsOpen(true);
    }
  }, [isUploadRequested, setCurrentKey, setIsOpen]);

  const handleTabClick = (key: SidebarKey) => {
    if (isOpen && validCurrentKey === key) {
      setIsOpen(false);
      return;
    }

    setCurrentKey(key);
    if (!isOpen) {
      setIsOpen(true);
    }
    if (key === "chat") {
      resetChatUnreadCount();
    }
  };

  return {
    sidebarKeys,
    validCurrentKey,
    isOpen,
    handleTabClick,
    toggleSidebar,
    openSidebarWithLastKey,
  };
};

export default useSidebarState;
