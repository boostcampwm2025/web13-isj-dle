import type { ActionHook } from "./action.types";
import { Briefcase } from "lucide-react";
import Phaser from "phaser";
import type { Socket } from "socket.io-client";

import { useState } from "react";

export const useDeskZoneAction: ActionHook = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);

  const handleClick = () => {
    // TODO: Implement navigation to desk zone
    if (!game || !socket) return;
    console.log("Navigating to Desk Zone");
  };

  return {
    title: "데스크 존으로 가기",
    icon: <Briefcase color="orange" />,
    handleClick,
    setGame,
    setSocket,
  };
};
