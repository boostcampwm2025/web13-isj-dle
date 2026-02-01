import type { GameScene } from "../core";
import { GAME_SCENE_KEY } from "../model/game.constants";
import { useAvatarLoader } from "../model/use-avatar-loader";
import { useAvatarRenderer } from "../model/use-avatar-renderer";
import { useGameInitialization } from "../model/use-game-initialization";
import { useGameRegistry } from "../model/use-game-registry";
import { useGameSocket } from "../model/use-game-socket";
import { usePhaserGame } from "../model/use-phaser-game";
import { useRoomSelector } from "../model/use-room-selector";
import { MinimapOverlay } from "./MinimapOverlay";
import { RoomSelectorModal } from "./RoomSelectorModal";

import { useCallback, useEffect, useRef } from "react";

import { useCollaborationToolStore } from "@entities/collaboration-tool";
import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@shared/config";
import { type DeskStatus, LecternEventType } from "@shared/types";

interface PhaserLayoutProps {
  mode: VideoConferenceMode;
}

const PhaserLayout = ({ mode }: PhaserLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { joinRoom } = usePhaserGame();
  const { socket, isConnected } = useWebSocket();
  const clearAllKnocks = useKnockStore((state) => state.clearAllKnocks);
  const user = useUserStore((state) => state.user);
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const isCollaborationToolOpen = useCollaborationToolStore((state) => state.activeTool !== null);

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

  const { game } = useGameInitialization(containerRef);

  const updateMyDeskStatus = useCallback(
    (status: DeskStatus | null) => {
      if (!game) return;
      const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
      if (scene?.isReady) {
        scene.nickname.updateIndicator(status);
      }
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
      scene.nickname.updateIndicator(user?.deskStatus ?? null);
    }
  }, [game, user?.deskStatus]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <MinimapOverlay game={game} isHidden={mode === VIDEO_CONFERENCE_MODE.FULL_GRID || isCollaborationToolOpen} />
      <RoomSelectorModal
        isOpen={roomSelectorOpen}
        roomRange={selectedRoomRange}
        onSelect={handleRoomSelect}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default PhaserLayout;
