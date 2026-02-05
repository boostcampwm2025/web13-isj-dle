import { useCallback, useMemo, useRef } from "react";

import type { ActionHook } from "@shared/config";

import { Maximize } from "lucide-react";

export const useViewModeAction: ActionHook = () => {
  const triggerRef = useRef<(() => void) | null>(null);

  const toggleViewMode = useCallback(() => {
    triggerRef.current?.();
  }, []);

  const setTrigger = useCallback((fn: (() => void) | null) => {
    triggerRef.current = fn;
  }, []);

  const title = useMemo(() => "확대", []);
  const icon = useMemo(() => <Maximize color="green" />, []);

  return useMemo(
    () => ({
      title,
      icon,
      handleClick: toggleViewMode,
      setTrigger,
    }),
    [title, icon, toggleViewMode, setTrigger],
  );
};
