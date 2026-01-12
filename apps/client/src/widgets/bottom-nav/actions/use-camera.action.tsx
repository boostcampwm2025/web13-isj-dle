import type { BottomNavHook } from "../model/bottom-nav.types";
import { Video, VideoOff } from "lucide-react";

import { useState } from "react";

export const useCameraAction: BottomNavHook = () => {
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  return {
    title: "카메라 on/off",
    isOn: isCameraOn,
    icon: isCameraOn ? <Video color="green" /> : <VideoOff color="red" />,
    handleClick: toggleCamera,
  };
};
