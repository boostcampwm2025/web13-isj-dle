import { useVideoConferenceModeStore } from "@entities/video-conference-mode";
import { PhaserLayout } from "@features/game";
import { TimerStopwatchNotifier } from "@features/timer-stopwatch-sidebar";
import { TutorialProvider } from "@features/tutorial";
import "@livekit/components-styles";
import { VIDEO_CONFERENCE_MODE } from "@shared/config";
import { SIDEBAR_ANIMATION_DURATION, SIDEBAR_TAB_WIDTH, SIDEBAR_WIDTH } from "@shared/config";
import { BottomNav } from "@widgets/bottom-nav";
import { Sidebar, useSidebarStore } from "@widgets/sidebar";
import { VideoConference } from "@widgets/video-conference";

const HomePage = () => {
  const mode = useVideoConferenceModeStore((state) => state.mode);
  const isSidebarOpen = useSidebarStore((state) => state.isOpen);

  return (
    <TutorialProvider autoStart={true}>
      <div className="relative h-screen w-screen overflow-hidden bg-gray-300">
        <TimerStopwatchNotifier />
        <div
          className="absolute inset-0 overflow-hidden rounded-r-2xl transition-[right] ease-in-out"
          style={{
            right: isSidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_TAB_WIDTH,
            transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
          }}
        >
          <PhaserLayout />

          <div className="pointer-events-none absolute inset-0 z-10">
            <VideoConference />
            {mode !== VIDEO_CONFERENCE_MODE.FULL_GRID && <BottomNav />}
          </div>
        </div>

        <Sidebar />
      </div>
    </TutorialProvider>
  );
};

export default HomePage;
