import { useCallback, useRef, useSyncExternalStore } from "react";

import { useUserStore } from "@entities/user";

export const useVisibleUsers = () => {
  const cacheRef = useRef<{ key: string; value: Set<string> | null }>({ key: "", value: null });

  const getSnapshot = useCallback((): Set<string> | null => {
    const state = useUserStore.getState();
    const currentRoomId = state.user?.avatar.currentRoomId ?? null;
    const currentContactId = state.user?.contactId ?? null;

    if (currentRoomId !== "lobby" || !currentContactId) {
      const key = "none";
      if (cacheRef.current.key === key) return cacheRef.current.value;
      cacheRef.current = { key, value: null };
      return null;
    }

    const ids = state.users
      .filter((u) => u.contactId === currentContactId)
      .map((u) => u.id)
      .sort((a, b) => a.localeCompare(b));
    const key = `${currentContactId}|${ids.join(",")}`;
    if (cacheRef.current.key === key) return cacheRef.current.value;

    const value = new Set(ids);
    cacheRef.current = { key, value };
    return value;
  }, []);

  const subscribe = useCallback((onStoreChange: () => void) => {
    return useUserStore.subscribe(() => onStoreChange());
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
