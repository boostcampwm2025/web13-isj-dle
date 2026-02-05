import type { Avatar, AvatarDirection, AvatarState, DeskStatus, UpdateAuthUserPayload, User } from "@shared/types";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type UserUpdate = Partial<Omit<User, "avatar">> & {
  socketId: string;
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
  get: (socketId: string): PositionData | undefined => positionMap.get(socketId),

  set: (socketId: string, data: PositionData) => {
    positionMap.set(socketId, data);
    positionListeners.forEach((listener) => listener());
  },

  delete: (socketId: string) => {
    positionMap.delete(socketId);
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
  removeUser: (socketId: string) => void;
  updateUser: (updated: UserUpdate) => void;
  updateUserInfo: (updated: UpdateAuthUserPayload & { userId: number }) => void;
  updateUserPosition: (socketId: string, x: number, y: number, direction: AvatarDirection, state: AvatarState) => void;
  updateUserDeskStatus: (socketId: string, status: DeskStatus | null) => void;

  resetUsersDeskStatus: () => void;
}

export const useUserStore = create(
  subscribeWithSelector<UserState>((set, get) => ({
    user: null,
    users: [],

    setSyncUsers: (user, users) => {
      users.forEach((u) => {
        positionStore.set(u.socketId, {
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
        const exists = state.users.some((u) => u.socketId === user.socketId);
        if (exists) return state;

        positionStore.set(user.socketId, {
          x: user.avatar.x,
          y: user.avatar.y,
          direction: user.avatar.direction,
          state: user.avatar.state,
        });
        return { users: [...state.users, user] };
      }),

    removeUser: (socketId) =>
      set((state) => {
        positionStore.delete(socketId);
        return { users: state.users.filter((u) => u.socketId !== socketId) };
      }),

    updateUser: (updated) =>
      set((state) => {
        if (updated.avatar && ("x" in updated.avatar || "y" in updated.avatar)) {
          const socketId = updated.socketId;
          const current = positionStore.get(socketId);
          if (current) {
            positionStore.set(socketId, {
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
            if (state.user?.socketId === updated.socketId && updated.avatar) {
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
            u.socketId === updated.socketId
              ? {
                  ...u,
                  ...updated,
                  avatar: updated.avatar ? { ...u.avatar, ...updated.avatar } : u.avatar,
                }
              : u,
          ),
          user:
            state.user?.socketId === updated.socketId
              ? {
                  ...state.user,
                  ...updated,
                  avatar: updated.avatar ? { ...state.user.avatar, ...updated.avatar } : state.user.avatar,
                }
              : state.user,
        };
      }),

    updateUserInfo: (updated) =>
      set((state) => {
        const updatedUsers = state.users.map((u) => {
          if (u.userId === updated.userId) {
            const newUser = {
              ...u,
              nickname: updated.nickname ?? u.nickname,
              avatar: updated.avatarAssetKey ? { ...u.avatar, assetKey: updated.avatarAssetKey } : u.avatar,
            };
            return newUser;
          }
          return u;
        });

        return {
          users: updatedUsers,
          user:
            state.user?.userId === updated.userId
              ? {
                  ...state.user,
                  nickname: updated.nickname ?? state.user.nickname,
                  avatar: updated.avatarAssetKey
                    ? { ...state.user.avatar, assetKey: updated.avatarAssetKey }
                    : state.user.avatar,
                }
              : state.user,
        };
      }),

    updateUserPosition: (socketId, x, y, direction, avatarState) => {
      positionStore.set(socketId, { x, y, direction, state: avatarState });

      const state = get();
      if (state.user?.socketId === socketId) {
        set({
          user: { ...state.user, avatar: { ...state.user.avatar, x, y, direction, state: avatarState } },
        });
      }
    },

    updateUserDeskStatus: (socketId, status) =>
      set((state) => ({
        users: state.users.map((u) => (u.socketId === socketId ? { ...u, deskStatus: status } : u)),
        user: state.user?.socketId === socketId ? { ...state.user, deskStatus: status } : state.user,
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
