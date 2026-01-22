import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { Video, VideoOff } from "lucide-react";

import { useEffect, useState } from "react";

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

  const toggleCamera = async () => {
    const newState = !isCameraOn;
    await localParticipant?.setCameraEnabled(newState);
    if (userId) {
      updateUser({ id: userId, cameraOn: newState });
    }
    socket?.emit(UserEventType.USER_UPDATE, { cameraOn: newState });
  };

  return {
    title: "카메라 on/off",
    isOn: isCameraOn,
    icon: isCameraOn ? <Video color="green" /> : <VideoOff color="red" />,
    handleClick: toggleCamera,
    setLocalParticipant,
  };
};
