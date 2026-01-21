import { useLivekit } from "../model/use-livekit";
import { useVideoConference } from "../model/use-video-conference";

import { useCallback, useRef } from "react";

import { useUserStore } from "@entities/user";
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
import { VIDEO_CONFERENCE_MODE } from "@shared/config";
import { LecternEventType } from "@shared/types";
import { BottomNav } from "@widgets/bottom-nav";
import { RoomSelectorModal } from "@widgets/room-selector-modal";
import { Sidebar, useSidebarStore } from "@widgets/sidebar";

const RoomPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { joinRoom } = usePhaserGame();
  const { socket, isConnected } = useWebSocket();
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

  useGameSocket(game, socket, isConnected);
  useAvatarLoader(game);
  useGameRegistry(game, joinRoom ?? null, openRoomSelector, lecternEnter, lecternLeave);
  useAvatarRenderer(game);

  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl } = useLivekit();
  const { mode, setMode, roomId } = useVideoConference();
  const isSidebarOpen = useSidebarStore((state) => state.isOpen);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 z-0" />

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
