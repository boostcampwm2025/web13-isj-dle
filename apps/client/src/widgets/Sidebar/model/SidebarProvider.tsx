import type { SidebarKey } from "./sidebar.types";
import { SidebarContext } from "./use-sidebar";

import { type ReactNode, useState } from "react";

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [sidebarKeys, setSidebarKeys] = useState<SidebarKey[]>(["users"]);

  const addKey = (key: SidebarKey) => {
    if (!sidebarKeys.includes(key)) {
      setSidebarKeys((prev) => [...prev, key]);
    }
  };

  const removeKey = (key: SidebarKey) => {
    setSidebarKeys((prev) => prev.filter((k) => k !== key));
  };

  return (
    <SidebarContext.Provider
      value={{
        sidebarKeys,
        addKey,
        removeKey,
        setSidebarKeys,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
