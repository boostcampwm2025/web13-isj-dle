import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { ParticipantEvent } from "livekit-client";
import { ScreenShare, ScreenShareOff } from "lucide-react";

import { useEffect, useState } from "react";

export const useScreenShareAction: ActionHook = () => {
  const [isScreenShareOn, setIsScreenShareOn] = useState<boolean>(false);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);

  useEffect(() => {
    if (!localParticipant) return;

    const updateScreenShareState = () => {
      setIsScreenShareOn(localParticipant.isScreenShareEnabled);
    };

    updateScreenShareState();

    localParticipant.on(ParticipantEvent.LocalTrackPublished, updateScreenShareState);
    localParticipant.on(ParticipantEvent.LocalTrackUnpublished, updateScreenShareState);

    return () => {
      localParticipant.off(ParticipantEvent.LocalTrackPublished, updateScreenShareState);
      localParticipant.off(ParticipantEvent.LocalTrackUnpublished, updateScreenShareState);
    };
  }, [localParticipant]);

  const toggleScreenShare = async () => {
    if (localParticipant) {
      await localParticipant.setScreenShareEnabled(!isScreenShareOn);
    } else {
      console.warn("Local participant is not available to toggle screen share.");
    }
  };

  return {
    title: "화면 공유",
    isOn: isScreenShareOn,
    icon: isScreenShareOn ? <ScreenShare color="green" /> : <ScreenShareOff color="red" />,
    handleClick: toggleScreenShare,
    setLocalParticipant,
  };
};
