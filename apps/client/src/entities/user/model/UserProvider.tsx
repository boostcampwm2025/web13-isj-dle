import { UserContext } from "./user-context";
import type { User } from "./user.types";

import { type ReactNode, useState } from "react";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const addUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
  };

  const removeUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const updateUser = (updated: Partial<User> & { id: string }) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));

    if (user?.id === updated.id) {
      setUser((prev) => (prev ? { ...prev, ...updated } : prev));
    }
  };

  return (
    <UserContext.Provider value={{ user, users, setUser, addUser, removeUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};
