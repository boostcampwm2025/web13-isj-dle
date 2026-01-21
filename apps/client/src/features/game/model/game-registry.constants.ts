import type { DeskStatus } from "@shared/types";

export const GAME_REGISTRY_KEYS = {
  OPEN_ROOM_SELECTOR: "openRoomSelector",
  JOIN_ROOM: "joinRoom",
  LECTERN_ENTER: "lecternEnter",
  LECTERN_LEAVE: "lecternLeave",
  UPDATE_MY_DESK_STATUS: "updateMyDeskStatus",
} as const;

export interface GameRegistryFunctions {
  [GAME_REGISTRY_KEYS.OPEN_ROOM_SELECTOR]: (roomRange: string) => void;
  [GAME_REGISTRY_KEYS.JOIN_ROOM]: (roomId: string) => void;
  [GAME_REGISTRY_KEYS.LECTERN_ENTER]: (roomId: string) => void;
  [GAME_REGISTRY_KEYS.LECTERN_LEAVE]: (roomId: string) => void;
  [GAME_REGISTRY_KEYS.UPDATE_MY_DESK_STATUS]: (status: DeskStatus | null) => void;
}

export const getRegistryFunction = <K extends keyof GameRegistryFunctions>(
  game: Phaser.Game,
  registryKey: K,
): GameRegistryFunctions[K] | null => {
  const fn = game.registry.get(registryKey);

  if (typeof fn === "function") {
    return fn as GameRegistryFunctions[K];
  }

  return null;
};

export const setRegistryFunction = <K extends keyof GameRegistryFunctions>(
  game: Phaser.Game,
  registryKey: K,
  fn: GameRegistryFunctions[K],
): void => {
  game.registry.set(registryKey, fn);
};
