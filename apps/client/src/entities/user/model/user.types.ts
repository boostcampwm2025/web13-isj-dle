import type { Avatar, AvatarDirection, AvatarState, User } from "@shared/types";

export type UserUpdate = Partial<Omit<User, "avatar">> & {
  id: string;
  avatar?: Partial<Avatar>;
};

export interface UserContextType {
  user: User | null;
  users: User[];
  setUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (updated: UserUpdate) => void;
  updateUserPosition: (userId: string, x: number, y: number, direction: AvatarDirection, state: AvatarState) => void;
}
