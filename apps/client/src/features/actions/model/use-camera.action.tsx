import { useCallback, useEffect, useMemo, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import type { ActionHook } from "@shared/config";
import { UserEventType } from "@shared/types";

import type { LocalParticipant } from "livekit-client";
import { Video, VideoOff } from "lucide-react";

export const useCameraAction: ActionHook = () => {
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const isCameraOn = useUserStore((state) => state.user?.cameraOn ?? false);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!localParticipant) return;

    if (localParticipant.isCameraEnabled !== isCameraOn) {
      (async () => {
        try {
          await localParticipant.setCameraEnabled(isCameraOn);
        } catch (err) {
          console.error("Failed to sync camera state", err);
        }
      })();
    }
  }, [isCameraOn, localParticipant]);

  const toggleCamera = useCallback(async () => {
    const newState = !isCameraOn;
    socket?.emit(UserEventType.USER_UPDATE, { cameraOn: newState });
  }, [isCameraOn, socket]);

  const title = useMemo(() => (isCameraOn ? "카메라 끄기" : "카메라 켜기"), [isCameraOn]);

  const icon = useMemo(() => {
    return isCameraOn ? <Video color="green" /> : <VideoOff color="red" />;
  }, [isCameraOn]);

  return useMemo(
    () => ({
      title,
      isOn: isCameraOn,
      icon,
      handleClick: toggleCamera,
      setLocalParticipant,
    }),
    [title, isCameraOn, icon, toggleCamera, setLocalParticipant],
  );
};
