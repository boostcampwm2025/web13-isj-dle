import { useAvatarLoader } from "../model/use-avatar-loader";
import { useAvatarRenderer } from "../model/use-avatar-renderer";
import { useGameInitialization } from "../model/use-game-initialization";
import { useGameRegistry } from "../model/use-game-registry";
import { useGameSocket } from "../model/use-game-socket";
import { usePhaserGame } from "../model/use-phaser-game";
import { useRoomSelector } from "../model/use-room-selector";

import { useRef } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@shared/lib/websocket";
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

  useGameSocket(game, socket, isConnected);
  useAvatarLoader(game, user);
  useGameRegistry(game, joinRoom ?? null, openRoomSelector);
  useAvatarRenderer(game, users, user);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      />
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
