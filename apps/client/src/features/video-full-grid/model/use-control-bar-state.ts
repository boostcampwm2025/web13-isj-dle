import { RoomEvent } from "livekit-client";

import { useEffect, useState } from "react";

import { useRoomContext } from "@livekit/components-react";

export const useControlBarState = () => {
  const room = useRoomContext();
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  useEffect(() => {
    const updateScreenShareState = () => {
      setIsScreenShareEnabled(room.localParticipant.isScreenShareEnabled);
    };

    updateScreenShareState();

    room.on(RoomEvent.LocalTrackPublished, updateScreenShareState);
    room.on(RoomEvent.LocalTrackUnpublished, updateScreenShareState);

    return () => {
      room.off(RoomEvent.LocalTrackPublished, updateScreenShareState);
      room.off(RoomEvent.LocalTrackUnpublished, updateScreenShareState);
    };
  }, [room]);

  return {
    isScreenShareEnabled,
  };
};
