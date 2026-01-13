import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { Mic, MicOff } from "lucide-react";

import { useState } from "react";

export const useMicAction: ActionHook = () => {
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [isMicOn, setIsMicOn] = useState<boolean>(false);

  const toggleMic = async () => {
    const newState = !isMicOn;
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(newState);
    } else {
      console.warn("Local participant is not available to toggle microphone.");
    }
    setIsMicOn(newState);
  };

  return {
    title: "마이크 on/off",
    isOn: isMicOn,
    icon: isMicOn ? <Mic color="green" /> : <MicOff color="red" />,
    handleClick: toggleMic,
    setLocalParticipant,
  };
};
