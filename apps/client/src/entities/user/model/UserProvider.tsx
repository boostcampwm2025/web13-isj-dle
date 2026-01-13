import { UserContext } from "./user-context";
import type { UserUpdate } from "./user.types";

import { type ReactNode, useCallback, useMemo, useState } from "react";

import type { AvatarDirection, AvatarState, User } from "@shared/types";

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

  const updateUser = useCallback((updated: UserUpdate) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === updated.id
          ? {
              ...u,
              ...updated,
              avatar: updated.avatar ? { ...u.avatar, ...updated.avatar } : u.avatar,
            }
          : u,
      ),
    );

    setUser((prev) => {
      if (prev?.id === updated.id) {
        return {
          ...prev,
          ...updated,
          avatar: updated.avatar ? { ...prev.avatar, ...updated.avatar } : prev.avatar,
        };
      }
      return prev;
    });
  }, []);

  const updateUserPosition = useCallback(
    (userId: string, x: number, y: number, direction: AvatarDirection, state: AvatarState) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, avatar: { ...u.avatar, x, y, direction, state } } : u)),
      );

      setUser((prev) => {
        if (prev?.id === userId) {
          return { ...prev, avatar: { ...prev.avatar, x, y, direction, state } };
        }
        return prev;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      users,
      setUser,
      setUsers,
      addUser,
      removeUser,
      updateUser,
      updateUserPosition,
    }),
    [user, users, addUser, removeUser, updateUser, updateUserPosition],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
