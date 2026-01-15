import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { ScreenShare, ScreenShareOff } from "lucide-react";

import { useState } from "react";

export const useScreenShareAction: ActionHook = () => {
  const [isScreenShareOn, setIsScreenShareOn] = useState<boolean>(false);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);

  const toggleScreenShare = async () => {
    const newState = !isScreenShareOn;
    if (localParticipant) {
      await localParticipant.setScreenShareEnabled(newState);
    } else {
      console.warn("Local participant is not available to toggle screen share.");
    }
    setIsScreenShareOn(newState);
  };

  return {
    title: "화면 공유",
    isOn: isScreenShareOn,
    icon: isScreenShareOn ? <ScreenShare color="green" /> : <ScreenShareOff color="red" />,
    handleClick: toggleScreenShare,
    setLocalParticipant,
  };
};
