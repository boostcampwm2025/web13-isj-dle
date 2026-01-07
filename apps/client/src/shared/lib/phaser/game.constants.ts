import { type AvatarDirection } from "@shared/types";

export const TILE_SIZE = 16;
export const TMJ_URL = "/assets/maps/world.tmj";
export const MAP_NAME = "world_map";
export const GAME_SCENE_KEY = "GameScene";

export const AVATAR_FRAME_WIDTH = 16;
export const AVATAR_FRAME_HEIGHT = 32;

export const HEAD_FRAME: Record<AvatarDirection, number> = {
  down: 0,
  left: 2,
  right: 3,
  up: 1,
};

export const IDLE_BODY_FRAME: Record<AvatarDirection, number> = {
  down: 27,
  left: 26,
  right: 24,
  up: 25,
};

export const WALK_BODY_FRAME: Record<AvatarDirection, number[]> = {
  down: [138, 139, 140, 141, 142],
  left: [133, 134, 135, 136, 137],
  right: [120, 121, 122, 123, 124],
  up: [126, 127, 128, 129, 130],
};

export const SIT_BODY_FRAME: Record<AvatarDirection, number> = {
  down: 200,
  left: 274,
  right: 264,
  up: 25,
};
