import { SIDEBAR_MAP } from "./sidebar.constants";
import type { SidebarKey } from "./sidebar.types";
import { useSidebar } from "./use-sidebar";

import { useMemo, useState } from "react";

const useSidebarState = () => {
  const { sidebarKeys } = useSidebar();
  const [currentKey, setCurrentKey] = useState<SidebarKey | null>(sidebarKeys[0] || null);
  const [isOpen, setIsOpen] = useState(true);

  const validCurrentKey = useMemo(() => {
    if (currentKey && sidebarKeys.includes(currentKey)) {
      return currentKey;
    }
    return sidebarKeys[0] || null;
  }, [currentKey, sidebarKeys]);

  const handleTabClick = (key: SidebarKey) => setCurrentKey(key);
  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const currentPanel = validCurrentKey ? SIDEBAR_MAP[validCurrentKey] : null;

  return { sidebarKeys, validCurrentKey, isOpen, currentPanel, handleTabClick, toggleSidebar };
};

export default useSidebarState;
