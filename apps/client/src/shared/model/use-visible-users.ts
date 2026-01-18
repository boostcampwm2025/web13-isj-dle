import { useMemo } from "react";

import { useUserStore } from "@entities/user";

export const useVisibleUsers = () => {
  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);

  const currentRoomId = user?.avatar.currentRoomId ?? null;
  const currentContactId = user?.contactId ?? null;

  return useMemo(() => {
    if (currentRoomId === "lobby" && currentContactId) {
      return new Set(users.filter((u) => u.contactId === currentContactId).map((u) => u.id));
    }
    return null;
  }, [users, currentRoomId, currentContactId]);
};
