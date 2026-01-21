import type { GameScene } from "../core/game-scene";
import { GAME_SCENE_KEY } from "./game.constants";

import { useEffect, useRef } from "react";

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

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;

    const renderAvatars = () => {
      const state = useUserStore.getState();
      const currentUser = state.user;
      if (!currentUser) return;

      const roomId = currentUser.avatar.currentRoomId;
      const myId = currentUser.id;
      const myNickname = currentUser.nickname;
      const positionMap = positionStore.getAll();

      const sameRoomUsers = state.users
        .filter((u) => u.id !== myId && u.nickname !== myNickname && u.avatar.currentRoomId === roomId)
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

      if (gameScene.isReady) {
        gameScene.renderAnotherAvatars(sameRoomUsers, currentUser);
      }
    };

    const unsubscribePosition = positionStore.subscribe(renderAvatars);

    const unsubscribeUsers = useUserStore.subscribe((state, prevState) => {
      const usersStructureChanged = !isSameUserStructure(state.users, prevState.users);

      const currentRoomChanged = state.user?.avatar.currentRoomId !== prevState.user?.avatar.currentRoomId;

      if (usersStructureChanged || currentRoomChanged) {
        renderAvatars();
      }
    });

    renderAvatars();

    return () => {
      unsubscribePosition();
      unsubscribeUsers();
    };
  }, [game]);
};
