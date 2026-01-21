import type { ActionHook } from "./action.types";
import { Briefcase } from "lucide-react";
import Phaser from "phaser";
import type { Socket } from "socket.io-client";

import { useState } from "react";

import { useUserStore } from "@entities/user";
import { GAME_SCENE_KEY, GameScene, isSameTileAtWorld } from "@features/game";
import { type AvatarState, RoomEventType, type RoomType, UserEventType } from "@shared/types";

export const useDeskZoneAction: ActionHook = () => {
  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);

  const handleClick = () => {
    if (!game || !socket || !user || (user.avatar.currentRoomId === "desk zone" && user.avatar.state === "sit")) {
      return;
    }
    const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    const deskSeats = scene.deskSeatPoints;
    for (const point of deskSeats) {
      const isOccupied = users.some((user) => isSameTileAtWorld(scene.mapInfo.map, user.avatar, point));
      if (!isOccupied) {
        socket.emit(RoomEventType.ROOM_JOIN, { roomId: "desk zone" as RoomType });
        socket.emit(UserEventType.PLAYER_MOVE, { ...point, state: "sit" as AvatarState });
        scene.movePlayer(point.x, point.y, point.direction, "sit" as AvatarState);
        return;
      }
    }
    alert("모든 데스크 존 좌석이 사용 중입니다.");
  };

  return {
    title: "데스크 존으로 가기",
    icon: <Briefcase color="orange" />,
    handleClick,
    setGame,
    setSocket,
  };
};
