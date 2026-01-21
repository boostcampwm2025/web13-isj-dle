import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { Mic, MicOff } from "lucide-react";

import { useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { UserEventType } from "@shared/types";

export const useMicAction: ActionHook = () => {
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const userId = useUserStore((state) => state.user?.id);
  const isMicOn = useUserStore((state) => state.user?.micOn ?? false);
  const updateUser = useUserStore((state) => state.updateUser);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!localParticipant) return;

    if (localParticipant.isMicrophoneEnabled !== isMicOn) {
      (async () => {
        try {
          await localParticipant.setMicrophoneEnabled(isMicOn);
        } catch (err) {
          console.error("Failed to sync microphone state", err);
        }
      })();
    }
  }, [isMicOn, localParticipant]);

  const toggleMic = async () => {
    const newState = !isMicOn;
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(newState);
    } else {
      console.warn("Local participant is not available to toggle microphone.");
    }
    if (userId) {
      updateUser({ id: userId, micOn: newState });
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
