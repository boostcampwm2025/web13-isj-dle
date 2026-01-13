import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { Video, VideoOff } from "lucide-react";

import { useState } from "react";

export const useCameraAction: ActionHook = () => {
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);

  const toggleCamera = async () => {
    const newState = !isCameraOn;
    if (localParticipant) {
      await localParticipant.setCameraEnabled(newState);
    } else {
      console.warn("Local participant is not available to toggle camera.");
    }
    setIsCameraOn(newState);
  };

  return {
    title: "카메라 on/off",
    isOn: isCameraOn,
    icon: isCameraOn ? <Video color="green" /> : <VideoOff color="red" />,
    handleClick: toggleCamera,
    setLocalParticipant,
  };
};
