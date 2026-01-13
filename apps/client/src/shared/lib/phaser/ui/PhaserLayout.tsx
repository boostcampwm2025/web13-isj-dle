import { useWebSocket } from "../../websocket";
import { GAME_SCENE_KEY } from "../model/game.constants";
import type { GameScene } from "../model/game.scene";
import { usePhaserGame } from "../model/use-phaser-game";

import { useEffect, useMemo, useRef } from "react";

import { getGameConfig } from "@shared/lib/phaser/model/game.config";
import type { User } from "@shared/types";
import { useUser } from "@src/entities/user";

interface PhaserLayoutProps {
  children: React.ReactNode;
}

const PhaserLayout = ({ children }: PhaserLayoutProps) => {
  const { game, setGame } = usePhaserGame();
  const { socket, isConnected } = useWebSocket();
  const { user, users } = useUser();
  const sameRoomUsersRef = useRef<User[]>([]);
  const userRef = useRef<User | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);

  const sameRoomUsers = useMemo(() => {
    if (!user) return [];
    const roomId = user.avatar.currentRoomId;
    const myId = user.id;
    return users.filter((u) => u.id !== myId && u.avatar.currentRoomId === roomId);
  }, [users, user]);

  const sameRoomSig = useMemo(() => {
    const usersSig = sameRoomUsers
      .map((u) => `${u.id}:${u.avatar.x}:${u.avatar.y}:${u.avatar.direction}:${u.avatar.state}:${u.contactId}`)
      .sort()
      .join("|");
    return `${usersSig}|me:${user?.contactId}`;
  }, [sameRoomUsers, user?.contactId]);

  useEffect(() => {
    sameRoomUsersRef.current = sameRoomUsers;
    userRef.current = user;
  }, [sameRoomUsers, user]);

  useEffect(() => {
    if (isInitializedRef.current) return;

    if (containerRef.current && !game) {
      const config = getGameConfig(containerRef.current);
      const gameInstance = new Phaser.Game(config);
      setGame(gameInstance);
      isInitializedRef.current = true;
    }

    return () => {
      if (game) {
        game.destroy(true);
        setGame(null);
        isInitializedRef.current = false;
      }
    };
  }, [game, setGame]);

  useEffect(() => {
    if (!game || !isConnected || !socket) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (gameScene.isInitializedSocket) return;

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", () => gameScene.setSocket(socket));
    } else {
      gameScene.setSocket(socket);
    }
  }, [game, socket, isConnected]);

  useEffect(() => {
    if (!game || !user) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (gameScene.isLoadPlayer) return;

    const loadUserAvatar = () => {
      gameScene.loadAvatar(user.avatar);
    };

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", loadUserAvatar);
    } else {
      loadUserAvatar();
    }
  }, [game, user]);

  useEffect(() => {
    if (!game || !user) return;

    const gameScene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;

    const render = () => gameScene.renderAnotherAvatars(sameRoomUsersRef.current, userRef.current);

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", render);
    } else {
      render();
    }
  }, [game, user, sameRoomSig]);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Phaser 게임 캔버스 */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      />
      {/* UI 오버레이 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PhaserLayout;
