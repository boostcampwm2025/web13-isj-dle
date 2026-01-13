import { useEffect } from "react";

import { VideoConference } from "@livekit/components-react";
import { useLocalParticipant } from "@livekit/components-react";
import { useAction } from "@src/features/actions";

const RoomContent = () => {
  const { getHookByKey } = useAction();
  const { localParticipant } = useLocalParticipant();

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

  return <VideoConference />;
};

export default RoomContent;
