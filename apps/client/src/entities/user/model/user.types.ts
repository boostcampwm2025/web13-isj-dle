import type { User } from "@shared/types";

export interface UserContextType {
  user: User | null;
  users: User[];
  setUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (updated: Partial<User> & { id: string }) => void;
}
