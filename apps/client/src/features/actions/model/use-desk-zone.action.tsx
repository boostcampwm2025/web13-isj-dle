import type { ActionHook } from "./action.types";
import { Briefcase } from "lucide-react";
import Phaser from "phaser";
import type { Socket } from "socket.io-client";

import { useCallback, useMemo, useState } from "react";

import { positionStore, useUserStore } from "@entities/user";
import { GAME_SCENE_KEY, GameScene, isSameTileAtWorld } from "@features/game";
import { emitAck } from "@features/socket";
import { type AvatarState, RoomEventType, type RoomType, UserEventType } from "@shared/types";

export const useDeskZoneAction: ActionHook = () => {
  const userId = useUserStore((state) => state.user?.id || "");
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const [state, setState] = useState<AvatarState | null>("idle");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);

  positionStore.subscribe(() => {
    const pos = positionStore.get(userId);
    if (pos && pos.state !== state) {
      setState(pos.state);
    }
  });

  const handleClick = useCallback(async () => {
    if (!game || !socket || (currentRoomId === "desk zone" && state === "sit")) {
      return;
    }
    const scene = game.scene.getScene(GAME_SCENE_KEY) as GameScene;
    if (!scene || !scene.mapInfo.map || !scene.deskSeatPoints.length) {
      return;
    }
    const map = scene.mapInfo.map;

    const deskSeats = scene.deskSeatPoints;
    deskSeats.sort(
      (a, b) => b.y - a.y || Math.abs(a.x - map.widthInPixels / 2) - Math.abs(b.x - map.widthInPixels / 2),
    );

    const allPositions = positionStore.getAll();

    for (const point of deskSeats) {
      const isOccupied = Array.from(allPositions.values()).some((avatar) => isSameTileAtWorld(map, avatar, point));
      if (!isOccupied) {
        let pass = await emitAck<{ success: boolean }>(socket, RoomEventType.ROOM_JOIN, {
          roomId: "desk zone" as RoomType,
        });
        if (!pass || !pass.success) continue;
        pass = await emitAck<{ success: boolean }>(socket, UserEventType.PLAYER_MOVE, {
          ...point,
          state: "sit" as AvatarState,
          force: true,
        });
        if (!pass || !pass.success) continue;
        return;
      }
    }
    alert("모든 데스크 존 좌석이 사용 중입니다.");
  }, [game, socket, currentRoomId, state]);

  const title = useMemo(() => "데스크 존으로 가기", []);
  const icon = useMemo(() => <Briefcase color="orange" />, []);

  return useMemo(
    () => ({
      title,
      icon,
      handleClick,
      setGame,
      setSocket,
    }),
    [title, icon, handleClick, setGame, setSocket],
  );
};
