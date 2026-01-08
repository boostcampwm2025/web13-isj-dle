import { type AvatarDirection } from "@shared/types";

export const TILE_SIZE = 16;
export const TMJ_URL = "/assets/maps/world.tmj";
export const MAP_NAME = "world_map";
export const GAME_SCENE_KEY = "GameScene";

export const AVATAR_FRAME_WIDTH = 16;
export const AVATAR_FRAME_HEIGHT = 32;
export const AVATAR_MOVE_SPEED = 120;
export const AVATAR_SNAP_SPEED = 0.25;

export const IDLE_FRAME: Record<AvatarDirection, number> = {
  down: 3,
  left: 2,
  right: 0,
  up: 1,
};

export const WALK_FRAME: Record<AvatarDirection, number[]> = {
  down: [68, 69, 70],
  left: [63, 64, 65],
  right: [51, 52, 53],
  up: [56, 57, 58],
};

export const SIT_FRAME: Record<AvatarDirection, number> = {
  down: 3,
  left: 126,
  right: 120,
  up: 1,
};
