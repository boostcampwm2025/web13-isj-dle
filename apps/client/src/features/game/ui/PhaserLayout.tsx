import type { GameScene } from "../core/game-scene";
import { GAME_SCENE_KEY } from "../model/game.constants";
import { useAvatarLoader } from "../model/use-avatar-loader";
import { useAvatarRenderer } from "../model/use-avatar-renderer";
import { useGameInitialization } from "../model/use-game-initialization";
import { useGameRegistry } from "../model/use-game-registry";
import { useGameSocket } from "../model/use-game-socket";
import { usePhaserGame } from "../model/use-phaser-game";
import { useRoomSelector } from "../model/use-room-selector";

import { useCallback, useEffect, useRef } from "react";

import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import type { DeskStatus } from "@shared/types";
import { LecternEventType } from "@shared/types";
import { RoomSelectorModal } from "@widgets/room-selector-modal";

interface PhaserLayoutProps {
  children: React.ReactNode;
}

const PhaserLayout = ({ children }: PhaserLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { joinRoom } = usePhaserGame();
  const { socket, isConnected } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const clearAllKnocks = useKnockStore((state) => state.clearAllKnocks);
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);

  const { game } = useGameInitialization(containerRef);

  const { roomSelectorOpen, selectedRoomRange, openRoomSelector, handleCloseModal, handleRoomSelect } = useRoomSelector(
    joinRoom,
    currentRoomId,
  );

  const lecternEnter = useCallback(
    (roomId: string) => {
      socket?.emit(LecternEventType.LECTERN_ENTER, { roomId });
    },
    [socket],
  );

  const lecternLeave = useCallback(
    (roomId: string) => {
      socket?.emit(LecternEventType.LECTERN_LEAVE, { roomId });
    },
    [socket],
  );

  const updateMyDeskStatus = useCallback(
    (status: DeskStatus | null) => {
      if (!game) return;
      const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
      scene?.updateMyNicknameIndicator(status);
    },
    [game],
  );

  useGameSocket(game, socket, isConnected);
  useAvatarLoader(game);
  useGameRegistry(
    game,
    joinRoom ?? null,
    openRoomSelector,
    lecternEnter,
    lecternLeave,
    updateMyDeskStatus,
    clearAllKnocks,
  );
  useAvatarRenderer(game);

  useEffect(() => {
    if (!game) return;
    const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (scene?.isReady) {
      scene.updateMyNicknameIndicator(user?.deskStatus ?? null);
    }
  }, [game, user?.deskStatus]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <div className="pointer-events-none absolute inset-0 z-10">{children}</div>
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
