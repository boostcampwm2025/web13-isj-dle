import { type AvatarDirection, TILE_SIZE } from "@shared/types";

export const TMJ_URL = "/assets/maps/world.tmj";
export const MAP_NAME = "world_map";
export const GAME_SCENE_KEY = "GameScene";

export const AVATAR_FRAME_WIDTH = 16;
export const AVATAR_FRAME_HEIGHT = 32;
export const AVATAR_MOVE_SPEED = 120;
export const AVATAR_SNAP_SPEED = 0.25;
export const NICKNAME_OFFSET_Y = 20;
export const RESTAURANT_THUMBNAIL_OFFSET_Y = 10;

export const AVATAR_RADIUS = TILE_SIZE / 2;
export const BOUNDARY_PADDING = 4;
export const BOUNDARY_OFFSET = AVATAR_RADIUS + BOUNDARY_PADDING;
export const BOUNDARY_DASH = {
  LENGTH: 4,
  GAP: 4,
};

export const IDLE_FRAME: Record<AvatarDirection, number> = {
  down: 3,
  left: 2,
  right: 0,
  up: 1,
};

export const WALK_FRAME: Record<AvatarDirection, number[]> = {
  down: [66, 67, 68, 69, 70, 71],
  left: [60, 61, 62, 63, 64, 65],
  right: [48, 49, 50, 51, 52, 53],
  up: [54, 55, 56, 57, 58, 59],
};

export const SIT_FRAME: Record<AvatarDirection, number> = {
  down: 3,
  left: 126,
  right: 120,
  up: 1,
};
