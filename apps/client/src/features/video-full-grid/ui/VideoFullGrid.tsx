import { usePinScreenShare } from "../model/use-pin-screen-share";
import { isEqualTrackRef } from "../model/utils";
import ControlBar from "./ControlBar";
import { RoomEvent, Track } from "livekit-client";

import {
  CarouselLayout,
  ConnectionStateToast,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  ParticipantTile,
  RoomAudioRenderer,
  isTrackReference,
  useCreateLayoutContext,
  usePinnedTracks,
  useTracks,
} from "@livekit/components-react";
import { SIDEBAR_TAB_WIDTH, SIDEBAR_WIDTH, type VideoConferenceMode } from "@shared/config";
import { useBindLocalParticipant } from "@shared/model";

interface VideoFullGridProps {
  setMode: (mode: VideoConferenceMode | null) => void;
  isSidebarOpen: boolean;
}

const VideoFullGrid = ({ setMode, isSidebarOpen }: VideoFullGridProps) => {
  useBindLocalParticipant();

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  const layoutContext = useCreateLayoutContext();

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((track) => track.publication.source === Track.Source.ScreenShare);

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

  usePinScreenShare({
    tracks,
    layoutContext,
    screenShareTracks,
    focusTrack,
  });

  return (
    <div
      className="lk-video-conference pointer-events-auto transition-all duration-500 ease-in-out"
      style={{
        width: isSidebarOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : `calc(100% - ${SIDEBAR_TAB_WIDTH}px)`,
      }}
    >
      <LayoutContextProvider value={layoutContext}>
        <div className="lk-video-conference-inner">
          {!focusTrack ? (
            <div className="lk-grid-layout-wrapper">
              <GridLayout tracks={tracks}>
                <ParticipantTile />
              </GridLayout>
            </div>
          ) : (
            <div className="lk-focus-layout-wrapper">
              <FocusLayoutContainer>
                <CarouselLayout tracks={carouselTracks}>
                  <ParticipantTile />
                </CarouselLayout>
                {focusTrack && <FocusLayout trackRef={focusTrack} />}
              </FocusLayoutContainer>
            </div>
          )}
          <ControlBar variation="minimal" setMode={setMode} />
        </div>
      </LayoutContextProvider>
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
};

export default VideoFullGrid;
