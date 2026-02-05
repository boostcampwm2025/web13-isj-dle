import { useCallback, useEffect, useMemo, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import type { ActionHook } from "@shared/config";
import { UserEventType } from "@shared/types";

import type { LocalParticipant } from "livekit-client";
import { Mic, MicOff } from "lucide-react";

export const useMicAction: ActionHook = () => {
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const isMicOn = useUserStore((state) => state.user?.micOn ?? false);
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
    socket?.emit(UserEventType.USER_UPDATE, { micOn: newState });
  }, [isMicOn, socket]);

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
