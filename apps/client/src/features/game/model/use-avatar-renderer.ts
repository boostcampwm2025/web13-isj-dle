import type { GameScene } from "../core/game-scene";
import { GAME_SCENE_KEY } from "./game.constants";

import { useEffect, useMemo, useRef } from "react";

import type { User } from "@shared/types";

export const useAvatarRenderer = (game: Phaser.Game | null, users: User[], currentUser: User | null) => {
  const sameRoomUsersRef = useRef<User[]>([]);
  const userRef = useRef<User | null>(null);

  const sameRoomUsers = useMemo(() => {
    if (!currentUser) return [];
    const roomId = currentUser.avatar.currentRoomId;
    const myId = currentUser.id;
    const myNickname = currentUser.nickname;
    return users.filter((u) => u.id !== myId && u.nickname !== myNickname && u.avatar.currentRoomId === roomId);
  }, [users, currentUser]);

  const sameRoomSig = useMemo(() => {
    const usersSig = sameRoomUsers
      .map(
        (u) =>
          `${u.id}:${u.avatar.x}:${u.avatar.y}:${u.avatar.direction}:${u.avatar.state}:${u.contactId}:${u.deskStatus}`,
      )
      .sort()
      .join("|");
    return `${usersSig}|me:${currentUser?.contactId}`;
  }, [sameRoomUsers, currentUser?.contactId]);

  useEffect(() => {
    sameRoomUsersRef.current = sameRoomUsers;
    userRef.current = currentUser;
  }, [sameRoomUsers, currentUser]);

  useEffect(() => {
    if (!game || !currentUser) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;

    const render = () => gameScene.renderAnotherAvatars(sameRoomUsersRef.current, userRef.current);

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", render);
    } else {
      render();
    }
  }, [game, currentUser, sameRoomSig]);

  return { sameRoomUsers };
};
