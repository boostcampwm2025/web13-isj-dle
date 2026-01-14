import { BottomNavContext } from "./use-bottom-nav";

import { type ReactNode, useCallback, useMemo, useState } from "react";

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

  const addKey = useCallback((key: ActionKey) => {
    setBottomNavigation((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }, []);

  const removeKey = useCallback((key: ActionKey) => {
    setBottomNavigation((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : prev));
  }, []);

  const value = useMemo(
    () => ({ bottomNavigation, setBottomNavigation, addKey, removeKey }),
    [bottomNavigation, addKey, removeKey],
  );

  return <BottomNavContext.Provider value={value}>{children}</BottomNavContext.Provider>;
};
