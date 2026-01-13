export const GAME_REGISTRY_KEYS = {
  OPEN_ROOM_SELECTOR: "openRoomSelector",
  JOIN_ROOM: "joinRoom",
} as const;

export interface GameRegistryFunctions {
  [GAME_REGISTRY_KEYS.OPEN_ROOM_SELECTOR]: (roomRange: string) => void;
  [GAME_REGISTRY_KEYS.JOIN_ROOM]: (roomId: string) => void;
}

export function getRegistryFunction<K extends keyof typeof GAME_REGISTRY_KEYS>(
  game: Phaser.Game,
  key: K,
): GameRegistryFunctions[(typeof GAME_REGISTRY_KEYS)[K]] | null {
  const registryKey = GAME_REGISTRY_KEYS[key];
  const fn = game.registry.get(registryKey);

  if (typeof fn === "function") {
    return fn as GameRegistryFunctions[(typeof GAME_REGISTRY_KEYS)[K]];
  }

  return null;
}

export function setRegistryFunction<K extends keyof typeof GAME_REGISTRY_KEYS>(
  game: Phaser.Game,
  key: K,
  fn: GameRegistryFunctions[(typeof GAME_REGISTRY_KEYS)[K]],
): void {
  const registryKey = GAME_REGISTRY_KEYS[key];
  game.registry.set(registryKey, fn);
}
