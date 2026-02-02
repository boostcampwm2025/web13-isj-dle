import { useLivekit } from "../model/use-livekit";
import { useVideoConference } from "../model/use-video-conference";
import NoiseFilter from "./NoiseFilter";

import { useCallback, useEffect, useRef } from "react";

import { ChatDataBinder } from "@entities/chat";
import { useCollaborationToolStore } from "@entities/collaboration-tool";
import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useAction } from "@features/actions";
import {
  GAME_SCENE_KEY,
  type GameScene,
  ZoomControl,
  useAvatarLoader,
  useAvatarRenderer,
  useGameInitialization,
  useGameRegistry,
  useGameSocket,
  usePhaserGame,
  useRoomSelector,
} from "@features/game";
import { MinimapOverlay } from "@features/game/ui/MinimapOverlay";
import { useKnockSocket } from "@features/knock";
import { useSyncImage } from "@features/restaurant-sidebar/model";
import { useWebSocket } from "@features/socket";
import { VideoFullGrid } from "@features/video-full-grid";
import { VideoThumbnail } from "@features/video-thumbnail";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { VIDEO_CONFERENCE_MODE } from "@shared/config";
import type { DeskStatus } from "@shared/types";
import { LecternEventType } from "@shared/types";
import { BottomNav } from "@widgets/bottom-nav";
import { RoomSelectorModal } from "@widgets/room-selector-modal";
import { Sidebar, useSidebarStore } from "@widgets/sidebar";

const RoomPage = () => {
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

  useKnockSocket();
  useSyncImage();

  useEffect(() => {
    if (!game) return;
    const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (scene?.isReady) {
      scene.nickname.updateIndicator(user?.deskStatus ?? null);
    }
  }, [game, user?.deskStatus]);

  const { getHookByKey } = useAction();
  const { isOn: isMicOn } = getHookByKey("mic");
  const { isOn: isCameraOn } = getHookByKey("camera");
  const { token, serverUrl, roomId } = useLivekit();
  const { mode, setMode } = useVideoConference();
  const isSidebarOpen = useSidebarStore((state) => state.isOpen);
  const isCollaborationToolOpen = useCollaborationToolStore((state) => state.activeTool !== null);
  const handleZoomChange = useCallback(() => {
    if (!game) return;
    const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (scene?.isReady) {
      scene.syncZoomFromStore();
    }
  }, [game]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      <div className="pointer-events-none absolute inset-0 z-10">
        <LiveKitRoom
          data-lk-theme={mode === VIDEO_CONFERENCE_MODE.FULL_GRID ? "default" : "none"}
          key={roomId || "empty"}
          serverUrl={serverUrl || ""}
          token={token || ""}
          connect={!!token && !!serverUrl}
          video={isCameraOn}
          audio={isMicOn}
        >
          <NoiseFilter />
          <ChatDataBinder />
          {mode === VIDEO_CONFERENCE_MODE.FULL_GRID && (
            <VideoFullGrid setMode={setMode} isSidebarOpen={isSidebarOpen} />
          )}
          {mode === VIDEO_CONFERENCE_MODE.THUMBNAIL && <VideoThumbnail />}
        </LiveKitRoom>
      </div>

      <ZoomControl
        isHidden={mode === VIDEO_CONFERENCE_MODE.FULL_GRID || isCollaborationToolOpen}
        onZoomChange={handleZoomChange}
      />

      <MinimapOverlay game={game} isHidden={mode === VIDEO_CONFERENCE_MODE.FULL_GRID || isCollaborationToolOpen} />

      <div className="pointer-events-none absolute inset-0 z-20">
        {mode !== VIDEO_CONFERENCE_MODE.FULL_GRID && <BottomNav />}
        <Sidebar />
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
