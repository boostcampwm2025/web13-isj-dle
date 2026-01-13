import { createContext, useContext } from "react";

import type { ActionKey } from "@src/features/actions";

interface BottomNavContextType {
  bottomNavigation: ActionKey[];
  addKey: (key: ActionKey) => void;
  removeKey: (key: ActionKey) => void;
  setBottomNavigation: (keys: ActionKey[]) => void;
}

export const BottomNavContext = createContext<BottomNavContextType | null>(null);

export const useBottomNav = () => {
  const context = useContext(BottomNavContext);

  if (!context) {
    throw new Error("useBottomNav must be used within BottomNavProvider");
  }

  return context;
};
