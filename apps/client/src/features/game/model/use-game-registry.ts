import { GAME_REGISTRY_KEYS, setRegistryFunction } from "./game-registry.constants";

import { useEffect } from "react";

export const useGameRegistry = (
  game: Phaser.Game | null,
  joinRoom: ((roomId: string) => void) | null | undefined,
  openRoomSelector: (roomRange: string) => void,
) => {
  useEffect(() => {
    if (game && joinRoom) {
      setRegistryFunction(game, "JOIN_ROOM", joinRoom);
    }

    return () => {
      if (game) {
        game.registry.remove(GAME_REGISTRY_KEYS.JOIN_ROOM);
      }
    };
  }, [game, joinRoom]);

  useEffect(() => {
    if (!game) return;

    setRegistryFunction(game, "OPEN_ROOM_SELECTOR", openRoomSelector);

    return () => {
      game.registry.remove(GAME_REGISTRY_KEYS.OPEN_ROOM_SELECTOR);
    };
  }, [game, openRoomSelector]);

  return null;
};
