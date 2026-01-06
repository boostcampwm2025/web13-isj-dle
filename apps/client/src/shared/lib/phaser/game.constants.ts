import { type AvatarDirection } from "@shared/types";

export const TILE_SIZE = 16;
export const TMJ_URL = "/assets/maps/world.tmj";
export const MAP_NAME = "world_map";
export const GAME_SCENE_KEY = "GameScene";

export const IDLE_BODY_FRAME: Record<AvatarDirection, number> = {
  down: 27,
  left: 4,
  right: 8,
  up: 4,
};

export const IDLE_HEAD_FRAME: Record<AvatarDirection, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};
