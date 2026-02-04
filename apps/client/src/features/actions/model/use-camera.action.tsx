import type { ActionHook } from "../../../shared/config/action.config";
import type { LocalParticipant } from "livekit-client";
import { Video, VideoOff } from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { UserEventType } from "@shared/types";

export const useCameraAction: ActionHook = () => {
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const userId = useUserStore((state) => state.user?.id);
  const isCameraOn = useUserStore((state) => state.user?.cameraOn ?? false);
  const updateUser = useUserStore((state) => state.updateUser);
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
    await localParticipant?.setCameraEnabled(newState);
    if (userId) {
      updateUser({ id: userId, cameraOn: newState });
    }
    socket?.emit(UserEventType.USER_UPDATE, { cameraOn: newState });
  }, [isCameraOn, localParticipant, userId, updateUser, socket]);

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
