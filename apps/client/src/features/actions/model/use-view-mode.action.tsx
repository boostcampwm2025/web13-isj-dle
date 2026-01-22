import type { ActionHook } from "./action.types";
import { Maximize } from "lucide-react";

import { useCallback, useRef } from "react";

export const useViewModeAction: ActionHook = () => {
  const triggerRef = useRef<(() => void) | null>(null);

  const toggleViewMode = () => {
    triggerRef.current?.();
  };

  const setTrigger = useCallback((fn: (() => void) | null) => {
    triggerRef.current = fn;
  }, []);

  return {
    title: "확대",
    icon: <Maximize color="green" />,
    handleClick: toggleViewMode,
    setTrigger,
  };
};
