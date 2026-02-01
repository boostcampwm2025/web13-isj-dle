import { useVideoConferenceModeStore } from "@entities/video-conference-mode";
import PhaserLayout from "@features/game/ui/PhaserLayout";
import { useKnockSocket } from "@features/knock";
import { useSyncImage } from "@features/restaurant-sidebar/model";
import "@livekit/components-styles";
import { VIDEO_CONFERENCE_MODE } from "@shared/config";
import { BottomNav } from "@widgets/bottom-nav";
import { Sidebar } from "@widgets/sidebar";
import { VideoConference } from "@widgets/video-conference";

const RoomPage = () => {
  useKnockSocket();
  useSyncImage();

  const mode = useVideoConferenceModeStore((state) => state.mode);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <PhaserLayout />

      <div className="pointer-events-none absolute inset-0 z-10">
        <VideoConference />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        {mode !== VIDEO_CONFERENCE_MODE.FULL_GRID && <BottomNav />}
        <Sidebar />
      </div>
    </div>
  );
};

export default RoomPage;
