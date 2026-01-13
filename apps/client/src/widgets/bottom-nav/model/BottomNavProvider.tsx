import { BottomNavContext } from "./use-bottom-nav";

import { type ReactNode, useState } from "react";

import { type ActionKey } from "@src/features/actions";

interface BottomNavProviderProps {
  children: ReactNode;
}

export const BottomNavProvider = ({ children }: BottomNavProviderProps) => {
  const [bottomNavigation, setBottomNavigation] = useState<ActionKey[]>([
    "camera",
    "mic",
    "screen_share",
    "desk_zone",
    "ai_note",
    "leave",
  ]);

  const addKey = (key: ActionKey) => {
    if (!bottomNavigation.includes(key)) {
      setBottomNavigation((prev) => [...prev, key]);
    }
  };

  const removeKey = (key: ActionKey) => {
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
