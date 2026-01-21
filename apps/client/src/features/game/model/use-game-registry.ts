import { GAME_REGISTRY_KEYS, setRegistryFunction } from "./game-registry.constants";

import { useEffect } from "react";

import type { DeskStatus } from "@shared/types";

export const useGameRegistry = (
  game: Phaser.Game | null,
  joinRoom: ((roomId: string) => void) | null | undefined,
  openRoomSelector: (roomRange: string) => void,
  lecternEnter: (roomId: string) => void,
  lecternLeave: (roomId: string) => void,
  updateMyDeskStatus?: (status: DeskStatus | null) => void,
) => {
  useEffect(() => {
    if (game && joinRoom) {
      setRegistryFunction(game, GAME_REGISTRY_KEYS.JOIN_ROOM, joinRoom);
    }

    return () => {
      if (game) {
        game.registry.remove(GAME_REGISTRY_KEYS.JOIN_ROOM);
      }
    };
  }, [game, joinRoom]);

  useEffect(() => {
    if (!game) return;

    setRegistryFunction(game, GAME_REGISTRY_KEYS.OPEN_ROOM_SELECTOR, openRoomSelector);

    return () => {
      game.registry.remove(GAME_REGISTRY_KEYS.OPEN_ROOM_SELECTOR);
    };
  }, [game, openRoomSelector]);

  useEffect(() => {
    if (!game) return;

    setRegistryFunction(game, GAME_REGISTRY_KEYS.LECTERN_ENTER, lecternEnter);

    return () => {
      game.registry.remove(GAME_REGISTRY_KEYS.LECTERN_ENTER);
    };
  }, [game, lecternEnter]);

  useEffect(() => {
    if (!game) return;

    setRegistryFunction(game, GAME_REGISTRY_KEYS.LECTERN_LEAVE, lecternLeave);

    return () => {
      game.registry.remove(GAME_REGISTRY_KEYS.LECTERN_LEAVE);
    };
  }, [game, lecternLeave]);

  useEffect(() => {
    if (!game || !updateMyDeskStatus) return;

    setRegistryFunction(game, GAME_REGISTRY_KEYS.UPDATE_MY_DESK_STATUS, updateMyDeskStatus);

    return () => {
      game.registry.remove(GAME_REGISTRY_KEYS.UPDATE_MY_DESK_STATUS);
    };
  }, [game, updateMyDeskStatus]);

  return null;
};
