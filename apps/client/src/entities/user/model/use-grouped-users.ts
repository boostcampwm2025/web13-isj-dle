import { useMemo } from "react";

import type { User } from "@shared/types";

export const useGroupedUsers = (user: User | null, users: User[]) => {
  const sameContactUsers = useMemo(() => {
    if (!user?.contactId) return [];
    return users.filter((u) => u.contactId === user.contactId);
  }, [users, user]);

  const usersByRoom = useMemo(() => {
    const grouped: Record<string, User[]> = {};
    users.forEach((user) => {
      if (!grouped[user.avatar.currentRoomId]) {
        grouped[user.avatar.currentRoomId] = [];
      }
      grouped[user.avatar.currentRoomId].push(user);
    });
    return grouped;
  }, [users]);

  return {
    sameContactUsers,
    usersByRoom,
  };
};
