import { type BottomNavKey } from "./bottom-nav.types";
import { BottomNavContext } from "./use-bottom-nav";

import { type ReactNode, useState } from "react";

interface BottomNavProviderProps {
  children: ReactNode;
}

export const BottomNavProvider = ({ children }: BottomNavProviderProps) => {
  const [bottomNavigation, setBottomNavigation] = useState<BottomNavKey[]>([
    "camera",
    "mic",
    "screen_share",
    "desk_zone",
    "ai_note",
    "leave",
  ]);

  const addKey = (key: BottomNavKey) => {
    if (!bottomNavigation.includes(key)) {
      setBottomNavigation((prev) => [...prev, key]);
    }
  };

  const removeKey = (key: BottomNavKey) => {
    setBottomNavigation((prev) => prev.filter((k) => k !== key));
  };

  return (
    <BottomNavContext.Provider
      value={{
        bottomNavigation,
        setBottomNavigation,
        addKey,
        removeKey,
      }}
    >
      {children}
    </BottomNavContext.Provider>
  );
};
