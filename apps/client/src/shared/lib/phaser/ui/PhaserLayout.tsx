import { useWebSocket } from "../../websocket";
import { GAME_REGISTRY_KEYS, setRegistryFunction } from "../model/game-registry.constants";
import { GAME_SCENE_KEY } from "../model/game.constants";
import type { GameScene } from "../model/game.scene";
import { usePhaserGame } from "../model/use-phaser-game";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getGameConfig } from "@shared/lib/phaser/model/game.config";
import type { RoomType, User } from "@shared/types";
import { useUserStore } from "@src/entities/user";
import { RoomSelectorModal } from "@src/widgets/room-selector-modal";

interface PhaserLayoutProps {
  children: React.ReactNode;
}

const PhaserLayout = ({ children }: PhaserLayoutProps) => {
  const { game, setGame, joinRoom } = usePhaserGame();
  const { socket, isConnected } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);
  const sameRoomUsersRef = useRef<User[]>([]);
  const userRef = useRef<User | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [roomSelectorOpen, setRoomSelectorOpen] = useState(false);
  const [selectedRoomRange, setSelectedRoomRange] = useState<string>("");
  const currentRoomId = user?.avatar.currentRoomId;
  const [prevRoomId, setPrevRoomId] = useState(currentRoomId);

  if (currentRoomId !== prevRoomId) {
    setPrevRoomId(currentRoomId);

    if (roomSelectorOpen && currentRoomId === "lobby") {
      setRoomSelectorOpen(false);
    }
  }

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
      gameScene.loadAvatar(user);
    };

    if (!gameScene.isReady) {
      gameScene.events.once("scene:ready", loadUserAvatar);
    } else {
      loadUserAvatar();
    }
  }, [game, user]);

  useEffect(() => {
    if (game && joinRoom) {
      setRegistryFunction(game, "JOIN_ROOM", joinRoom);
    }

    return () => {
      if (game) {
        game.registry.remove(GAME_REGISTRY_KEYS.JOIN_ROOM);
      }
    };
  }, [game, joinRoom]);

  useEffect(() => {
    if (!game) return;

    const openRoomSelector = (roomRange: string) => {
      setSelectedRoomRange(roomRange);
      setRoomSelectorOpen(true);
    };

    setRegistryFunction(game, "OPEN_ROOM_SELECTOR", openRoomSelector);

    return () => {
      game.registry.remove(GAME_REGISTRY_KEYS.OPEN_ROOM_SELECTOR);
    };
  }, [game]);

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

  const handleCloseModal = useCallback(() => {
    setRoomSelectorOpen(false);
  }, []);

  const handleRoomSelect = (roomId: RoomType) => {
    if (joinRoom) {
      joinRoom(roomId);
    }
    setRoomSelectorOpen(false);
  };

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
      {/* 회의실 선택 모달 */}
      <RoomSelectorModal
        isOpen={roomSelectorOpen}
        roomRange={selectedRoomRange}
        onSelect={handleRoomSelect}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PhaserLayout;
