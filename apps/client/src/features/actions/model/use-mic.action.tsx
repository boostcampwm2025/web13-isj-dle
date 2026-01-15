import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { Mic, MicOff } from "lucide-react";

import { useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@shared/lib/websocket";
import { UserEventType } from "@shared/types";

export const useMicAction: ActionHook = () => {
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);
  const { socket } = useWebSocket();

  const isMicOn = user?.micOn ?? false;

  const toggleMic = async () => {
    const newState = !isMicOn;
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(newState);
    } else {
      console.warn("Local participant is not available to toggle microphone.");
    }
    if (user) {
      updateUser({ id: user.id, micOn: newState });
    }
    socket?.emit(UserEventType.USER_UPDATE, { micOn: newState });
  };

  return {
    title: "마이크 on/off",
    isOn: isMicOn,
    icon: isMicOn ? <Mic color="green" /> : <MicOff color="red" />,
    handleClick: toggleMic,
    setLocalParticipant,
  };
};
