import type { SidebarKey } from "./sidebar.types";

import { createContext, useContext } from "react";

interface SidebarContextType {
  sidebarKeys: SidebarKey[];
  addKey: (key: SidebarKey) => void;
  removeKey: (key: SidebarKey) => void;
  setSidebarKeys: (keys: SidebarKey[]) => void;
}

export const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};
