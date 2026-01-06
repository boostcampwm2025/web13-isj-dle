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
};

export type MoveKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};
