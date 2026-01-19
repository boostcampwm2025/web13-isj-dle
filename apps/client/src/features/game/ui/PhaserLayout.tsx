import { useAvatarLoader } from "../model/use-avatar-loader";
import { useAvatarRenderer } from "../model/use-avatar-renderer";
import { useGameInitialization } from "../model/use-game-initialization";
import { useGameRegistry } from "../model/use-game-registry";
import { useGameSocket } from "../model/use-game-socket";
import { usePhaserGame } from "../model/use-phaser-game";
import { useRoomSelector } from "../model/use-room-selector";

import { useCallback, useRef } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
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
  const users = useUserStore((state) => state.users);

  const { game } = useGameInitialization(containerRef);

  const { roomSelectorOpen, selectedRoomRange, openRoomSelector, handleCloseModal, handleRoomSelect } = useRoomSelector(
    joinRoom,
    user?.avatar.currentRoomId,
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

  useGameSocket(game, socket, isConnected);
  useAvatarLoader(game, user);
  useGameRegistry(game, joinRoom ?? null, openRoomSelector, lecternEnter, lecternLeave);
  useAvatarRenderer(game, users, user);

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
