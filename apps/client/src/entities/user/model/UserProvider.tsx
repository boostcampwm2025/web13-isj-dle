import { UserContext } from "./user-context";

import { type ReactNode, useCallback, useMemo, useState } from "react";

import type { User } from "@shared/types";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const addUser = useCallback((user: User) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) return prev;
      return [...prev, user];
    });
  }, []);

  const removeUser = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const updateUser = useCallback((updated: Partial<User> & { id: string }) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));

    setUser((prev) => {
      if (prev?.id === updated.id) {
        return { ...prev, ...updated };
      }
      return prev;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      users,
      setUser,
      setUsers,
      addUser,
      removeUser,
      updateUser,
    }),
    [user, users, addUser, removeUser, updateUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
