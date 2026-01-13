import { Track } from "livekit-client";

import { useEffect } from "react";

import {
  GridLayout,
  RoomAudioRenderer,
  TrackRefContext,
  VideoTrack,
  isTrackReference,
  useTracks,
} from "@livekit/components-react";
import { useLocalParticipant } from "@livekit/components-react";
import { useAction } from "@src/features/actions";

const RoomContent = () => {
  const { getHookByKey } = useAction();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera]);

  useEffect(() => {
    const { setLocalParticipant: setMicLocalParticipant } = getHookByKey("mic");
    const { setLocalParticipant: setCameraLocalParticipant } = getHookByKey("camera");
    const { setLocalParticipant: setScreenShareLocalParticipant } = getHookByKey("screen_share");

    setMicLocalParticipant?.(localParticipant);
    setCameraLocalParticipant?.(localParticipant);
    setScreenShareLocalParticipant?.(localParticipant);

    return () => {
      setMicLocalParticipant?.(null);
      setCameraLocalParticipant?.(null);
      setScreenShareLocalParticipant?.(null);
    };
  }, [getHookByKey, localParticipant]);

  return (
    <>
      <GridLayout tracks={tracks}>
        <TrackRefContext.Consumer>
          {(trackRef) => (isTrackReference(trackRef) ? <VideoTrack trackRef={trackRef} /> : null)}
        </TrackRefContext.Consumer>
      </GridLayout>
      <RoomAudioRenderer />
    </>
  );
};

export default RoomContent;
