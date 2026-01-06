import { type AvatarDirection } from "@shared/types";

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

export type Player = {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Sprite;
  head: Phaser.GameObjects.Sprite;
  direction: AvatarDirection;
  state: "idle" | "walk" | "sit"; // Avatar의 state 논의 필요
};

export type MoveKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  sit: Phaser.Input.Keyboard.Key;
};
