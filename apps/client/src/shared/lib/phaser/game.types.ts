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
