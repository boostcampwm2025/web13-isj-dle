// Local (Page Model/Api)
import { useLivekit } from "../model/use-livekit";
import { useVideoConference } from "../model/use-video-conference";

import { useRef } from "react";

// Entities
import { useUserStore } from "@entities/user";
// Features
import { useAction } from "@features/actions";
import {
  useAvatarLoader,
  useAvatarRenderer,
  useGameInitialization,
  useGameRegistry,
  useGameSocket,
  usePhaserGame,
  useRoomSelector,
} from "@features/game";
import { useWebSocket } from "@features/socket";
import { VideoFullGrid } from "@features/video-full-grid";
import { VideoThumbnail } from "@features/video-thumbnail";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
// Shared
import { VIDEO_CONFERENCE_MODE } from "@shared/config";
// Widgets
import { BottomNav } from "@widgets/bottom-nav";
import { RoomSelectorModal } from "@widgets/room-selector-modal";
import { Sidebar, useSidebarStore } from "@widgets/sidebar";

const RoomPage = () => {
  // --- Phaser Game Logic ---
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

  // --- Video Conference Logic ---
  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl } = useLivekit();
  const { mode, setMode, roomId } = useVideoConference();
  const isSidebarOpen = useSidebarStore((state) => state.isOpen);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Game Layer */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* UI / Video Layer */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <LiveKitRoom
          data-lk-theme={mode === VIDEO_CONFERENCE_MODE.FULL_GRID ? "default" : "none"}
          key={roomId || ""}
          serverUrl={serverUrl || ""}
          token={token || ""}
          connect
          video={isCameraOn}
          audio={isMicOn}
        >
          {mode !== VIDEO_CONFERENCE_MODE.FULL_GRID && <BottomNav />}
          {mode === VIDEO_CONFERENCE_MODE.FULL_GRID && (
            <VideoFullGrid setMode={setMode} isSidebarOpen={isSidebarOpen} />
          )}
          {mode === VIDEO_CONFERENCE_MODE.THUMBNAIL && <VideoThumbnail />}
          <Sidebar />
        </LiveKitRoom>
      </div>

      {/* Modals */}
      <RoomSelectorModal
        isOpen={roomSelectorOpen}
        roomRange={selectedRoomRange}
        onSelect={handleRoomSelect}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default RoomPage;
