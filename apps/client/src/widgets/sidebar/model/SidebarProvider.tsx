import type { SidebarKey } from "./sidebar.types";
import { SidebarContext } from "./use-sidebar";

import { type ReactNode, useState } from "react";

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [sidebarKeys, setSidebarKeys] = useState<SidebarKey[]>(["users", "notices"]);
  const [isOpen, setIsOpen] = useState(true);
  const [currentKey, setCurrentKey] = useState<SidebarKey | null>(sidebarKeys[0] || null);

  const addKey = (key: SidebarKey) => {
    if (!sidebarKeys.includes(key)) {
      setSidebarKeys((prev) => [...prev, key]);
    }
  };

  const removeKey = (key: SidebarKey) => {
    setSidebarKeys((prev) => prev.filter((k) => k !== key));
  };

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        sidebarKeys,
        addKey,
        removeKey,
        setSidebarKeys,
        isOpen,
        setIsOpen,
        toggleSidebar,
        currentKey,
        setCurrentKey,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
