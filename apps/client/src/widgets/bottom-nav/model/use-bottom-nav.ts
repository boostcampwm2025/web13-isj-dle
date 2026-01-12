import type { BottomNavKey } from "./bottom-nav.types";

import { createContext, useContext } from "react";

interface BottomNavContextType {
  bottomNavigation: BottomNavKey[];
  addKey: (key: BottomNavKey) => void;
  removeKey: (key: BottomNavKey) => void;
  setBottomNavigation: (keys: BottomNavKey[]) => void;
}

export const BottomNavContext = createContext<BottomNavContextType | null>(null);

export const useBottomNav = () => {
  const context = useContext(BottomNavContext);

  if (!context) {
    throw new Error("useBottomNav must be used within BottomNavProvider");
  }

  return context;
};
