import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { Mic, MicOff } from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

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

  const toggleMic = useCallback(async () => {
    const newState = !isMicOn;
    await localParticipant?.setMicrophoneEnabled(newState);
    if (userId) {
      updateUser({ id: userId, micOn: newState });
    }
    socket?.emit(UserEventType.USER_UPDATE, { micOn: newState });
  }, [isMicOn, localParticipant, userId, updateUser, socket]);

  const title = useMemo(() => (isMicOn ? "마이크 끄기" : "마이크 켜기"), [isMicOn]);
  const icon = useMemo(() => {
    return isMicOn ? <Mic color="green" /> : <MicOff color="red" />;
  }, [isMicOn]);

  return useMemo(
    () => ({
      title,
      isOn: isMicOn,
      icon,
      handleClick: toggleMic,
      setLocalParticipant,
    }),
    [title, isMicOn, icon, toggleMic, setLocalParticipant],
  );
};
