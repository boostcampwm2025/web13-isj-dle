import type { AvatarDirection, AvatarState } from "@shared/types";

export type MapObj = {
  tmjUrl: string;
  name: string;
  map: Phaser.Tilemaps.Tilemap | null;
  depthCount: number;
  zoom: {
    index: number;
    levels: number[];
  };
};

export type AvatarEntity = {
  sprite: Phaser.Physics.Arcade.Sprite;
  direction: AvatarDirection;
  state: AvatarState;
};

export type MoveKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  sit: Phaser.Input.Keyboard.Key;
};

export type TilePoint = { x: number; y: number };
