import type { SidebarKey } from "./sidebar.types";

import { createContext, useContext } from "react";

interface SidebarContextType {
  sidebarKeys: SidebarKey[];
  addKey: (key: SidebarKey) => void;
  removeKey: (key: SidebarKey) => void;
  setSidebarKeys: (keys: SidebarKey[]) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  currentKey: SidebarKey | null;
  setCurrentKey: (key: SidebarKey | null) => void;
}

export const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};
