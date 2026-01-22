import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { Avatar, AvatarDirection, AvatarState, DeskStatus, User } from "@shared/types";

type UserUpdate = Partial<Omit<User, "avatar">> & {
  id: string;
  avatar?: Partial<Avatar>;
};

interface PositionData {
  x: number;
  y: number;
  direction: AvatarDirection;
  state: AvatarState;
}

const positionMap = new Map<string, PositionData>();
const positionListeners = new Set<() => void>();

export const positionStore = {
  get: (userId: string): PositionData | undefined => positionMap.get(userId),

  set: (userId: string, data: PositionData) => {
    positionMap.set(userId, data);
    positionListeners.forEach((listener) => listener());
  },

  delete: (userId: string) => {
    positionMap.delete(userId);
    positionListeners.forEach((listener) => listener());
  },

  subscribe: (listener: () => void) => {
    positionListeners.add(listener);
    return () => positionListeners.delete(listener);
  },

  getAll: () => new Map(positionMap),
};

interface UserState {
  user: User | null;
  users: User[];

  setSyncUsers: (user: User, users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (updated: UserUpdate) => void;
  updateUserPosition: (userId: string, x: number, y: number, direction: AvatarDirection, state: AvatarState) => void;
  updateUserDeskStatus: (userId: string, status: DeskStatus | null) => void;

  resetUsersDeskStatus: () => void;
}

export const useUserStore = create(
  subscribeWithSelector<UserState>((set, get) => ({
    user: null,
    users: [],

    setSyncUsers: (user, users) => {
      users.forEach((u) => {
        positionStore.set(u.id, {
          x: u.avatar.x,
          y: u.avatar.y,
          direction: u.avatar.direction,
          state: u.avatar.state,
        });
      });
      set({ user, users });
    },

    addUser: (user) =>
      set((state) => {
        const exists = state.users.some((u) => u.id === user.id);
        if (exists) return state;

        positionStore.set(user.id, {
          x: user.avatar.x,
          y: user.avatar.y,
          direction: user.avatar.direction,
          state: user.avatar.state,
        });
        return { users: [...state.users, user] };
      }),

    removeUser: (userId) =>
      set((state) => {
        positionStore.delete(userId);
        return { users: state.users.filter((u) => u.id !== userId) };
      }),

    updateUser: (updated) =>
      set((state) => {
        if (updated.avatar && ("x" in updated.avatar || "y" in updated.avatar)) {
          const userId = updated.id;
          const current = positionStore.get(userId);
          if (current) {
            positionStore.set(userId, {
              ...current,
              ...updated.avatar,
            } as PositionData);
          }
        }

        const hasNonPositionUpdate =
          updated.contactId !== undefined ||
          updated.micOn !== undefined ||
          updated.cameraOn !== undefined ||
          updated.nickname !== undefined;

        if (!hasNonPositionUpdate && updated.avatar) {
          const isPositionOnly =
            Object.keys(updated.avatar).every((k) => ["x", "y", "direction", "state"].includes(k)) &&
            Object.keys(updated).length === 2;

          if (isPositionOnly) {
            if (state.user?.id === updated.id && updated.avatar) {
              return {
                user: {
                  ...state.user,
                  avatar: { ...state.user.avatar, ...updated.avatar },
                },
              };
            }
            return state;
          }
        }

        return {
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
        };
      }),

    updateUserPosition: (userId, x, y, direction, avatarState) => {
      positionStore.set(userId, { x, y, direction, state: avatarState });

      const state = get();
      if (state.user?.id === userId) {
        set({
          user: { ...state.user, avatar: { ...state.user.avatar, x, y, direction, state: avatarState } },
        });
      }
    },

    updateUserDeskStatus: (userId, status) =>
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? { ...u, deskStatus: status } : u)),
        user: state.user?.id === userId ? { ...state.user, deskStatus: status } : state.user,
      })),
    resetUsersDeskStatus: () => {
      const myRoomId = get().user?.avatar.currentRoomId;
      if (myRoomId === "desk zone") {
        return;
      }
      set((state) => ({
        users: state.users.map((u) => ({ ...u, deskStatus: null })),
        user: state.user ? { ...state.user, deskStatus: null } : null,
      }));
    },
  })),
);
