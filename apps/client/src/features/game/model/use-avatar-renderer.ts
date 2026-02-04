import type { GameScene } from "../core";
import { GAME_SCENE_KEY } from "./game.constants";

import { useEffect, useRef } from "react";

import { useRestaurantImageStore, useRestaurantImageViewStore } from "@entities/restaurant-image";
import { positionStore, useUserStore } from "@entities/user";
import type { User } from "@shared/types";

const isSameUserStructure = (nextUsers: User[], prevUsers: User[]) => {
  if (nextUsers.length !== prevUsers.length) return false;

  return nextUsers.every((user, index) => user.id === prevUsers[index]?.id);
};

export const useAvatarRenderer = (game: Phaser.Game | null) => {
  const sameRoomUsersRef = useRef<User[]>([]);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    if (!game) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene | null;

    const renderAvatars = () => {
      const state = useUserStore.getState();
      const currentUser = state.user;
      if (!currentUser) return;

      const roomId = currentUser.avatar.currentRoomId;
      const myId = currentUser.id;
      const positionMap = positionStore.getAll();

      const sameRoomUsers = state.users
        .filter((u) => u.id !== myId && u.avatar.currentRoomId === roomId)
        .map((u) => {
          const pos = positionMap.get(u.id);
          if (pos) {
            return {
              ...u,
              avatar: {
                ...u.avatar,
                x: pos.x,
                y: pos.y,
                direction: pos.direction,
                state: pos.state,
              },
            };
          }
          return u;
        });

      sameRoomUsersRef.current = sameRoomUsers;
      userRef.current = currentUser;

      if (gameScene?.isReady) {
        gameScene.renderAnotherAvatars(sameRoomUsers, currentUser);
      }
    };

    const unsubscribePosition = positionStore.subscribe(renderAvatars);

    const unsubscribeUsers = useUserStore.subscribe((state, prevState) => {
      const usersStructureChanged = !isSameUserStructure(state.users, prevState.users);

      const currentRoomChanged = state.user?.avatar.currentRoomId !== prevState.user?.avatar.currentRoomId;

      const otherUserRoomChanged = state.users.some((user, index) => {
        const prevUser = prevState.users[index];
        return prevUser && user.avatar.currentRoomId !== prevUser.avatar.currentRoomId;
      });

      const deskStatusChanged = state.users.some((user, index) => {
        const prevUser = prevState.users[index];
        return prevUser && user.deskStatus !== prevUser.deskStatus;
      });

      const userInfoChanged = state.users.some((user, index) => {
        const prevUser = prevState.users[index];
        return prevUser && (user.nickname !== prevUser.nickname || user.avatar.assetKey !== prevUser.avatar.assetKey);
      });

      if (usersStructureChanged || currentRoomChanged || otherUserRoomChanged || deskStatusChanged || userInfoChanged) {
        renderAvatars();
      }
    });

    const unsubscribeThumbnails = useRestaurantImageStore.subscribe((state, prevState) => {
      if (state.thumbnailUrlByUserId !== prevState.thumbnailUrlByUserId) {
        renderAvatars();
      }
    });

    const unsubscribeImageViewModal = useRestaurantImageViewStore.subscribe((state, prevState) => {
      if (state.isOpen !== prevState.isOpen) {
        gameScene?.setInputEnabled(!state.isOpen);
      }
    });

    renderAvatars();

    return () => {
      unsubscribePosition();
      unsubscribeUsers();
      unsubscribeThumbnails();
      unsubscribeImageViewModal();
    };
  }, [game]);
};
