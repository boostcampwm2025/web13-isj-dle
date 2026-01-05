import type { User } from "./user.type";

import { createContext } from "react";

export interface UserContextType {
  user: User | null;
  users: User[];
  setUser: (user: User | null) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (updated: Partial<User> & { id: string }) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
