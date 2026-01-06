import { SIDEBAR_MAP } from "../model/sidebar.constants";
import type { SidebarKey } from "../model/sidebar.types";
import { useSidebar } from "../model/use-sidebar";

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
