import type { ActionHook } from "./action.types";
import type { LocalParticipant } from "livekit-client";
import { Video, VideoOff } from "lucide-react";

import { useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { UserEventType } from "@shared/types";

export const useCameraAction: ActionHook = () => {
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const userId = useUserStore((state) => state.user?.id);
  const isCameraOn = useUserStore((state) => state.user?.cameraOn ?? false);
  const updateUser = useUserStore((state) => state.updateUser);
  const { socket } = useWebSocket();

  const toggleCamera = async () => {
    const newState = !isCameraOn;
    if (localParticipant) {
      await localParticipant.setCameraEnabled(newState);
    } else {
      console.warn("Local participant is not available to toggle camera.");
    }
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
