import type { ActionHook } from "./action.types";
import { ScreenShare, ScreenShareOff } from "lucide-react";

import { useState } from "react";

export const useScreenShareAction: ActionHook = () => {
  const [isScreenShareOn, setIsScreenShareOn] = useState<boolean>(true);

  const toggleScreenShare = () => {
    setIsScreenShareOn((prev) => !prev);
  };

  return {
    title: "화면 공유",
    isOn: isScreenShareOn,
    icon: isScreenShareOn ? <ScreenShare color="green" /> : <ScreenShareOff color="red" />,
    handleClick: toggleScreenShare,
  };
};
