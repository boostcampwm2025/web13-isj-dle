import type { ActionHook } from "./action.types";
import { Mic, MicOff } from "lucide-react";

import { useState } from "react";

export const useMicAction: ActionHook = () => {
  const [isMicOn, setIsMicOn] = useState<boolean>(true);

  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  return {
    title: "마이크 on/off",
    isOn: isMicOn,
    icon: isMicOn ? <Mic color="green" /> : <MicOff color="red" />,
    handleClick: toggleMic,
  };
};
