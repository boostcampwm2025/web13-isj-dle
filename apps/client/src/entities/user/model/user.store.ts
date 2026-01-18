import { create } from "zustand";

import type { Avatar, AvatarDirection, AvatarState, User } from "@shared/types";

type UserUpdate = Partial<Omit<User, "avatar">> & {
  id: string;
  avatar?: Partial<Avatar>;
};

interface UserState {
  user: User | null;
  users: User[];

  setUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  setSyncUsers: (user: User, users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (updated: UserUpdate) => void;
  updateUserPosition: (userId: string, x: number, y: number, direction: AvatarDirection, state: AvatarState) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  users: [],

  setUser: (user) => set({ user }),
  setUsers: (users) => set({ users }),
  setSyncUsers: (user, users) => set({ user, users }),

  addUser: (user) =>
    set((state) => {
      const exists = state.users.some((u) => u.id === user.id);
      return exists ? state : { users: [...state.users, user] };
    }),

  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    })),

  updateUser: (updated) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === updated.id
          ? {
              ...u,
              ...updated,
              avatar: updated.avatar ? { ...u.avatar, ...updated.avatar } : u.avatar,
            }
          : u,
      ),
      user:
        state.user?.id === updated.id
          ? {
              ...state.user,
              ...updated,
              avatar: updated.avatar ? { ...state.user.avatar, ...updated.avatar } : state.user.avatar,
            }
          : state.user,
    })),

  updateUserPosition: (userId, x, y, direction, state) =>
    set((store) => ({
      users: store.users.map((u) => (u.id === userId ? { ...u, avatar: { ...u.avatar, x, y, direction, state } } : u)),
      user:
        store.user?.id === userId
          ? { ...store.user, avatar: { ...store.user.avatar, x, y, direction, state } }
          : store.user,
    })),
}));
