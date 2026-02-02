import type { RoomType } from "@shared/types";

export const MINIMAP_WIDTH = 230;
export const MINIMAP_HEIGHT = 210;
export const MINIMAP_HEADER = 24;
export const MINIMAP_MARGIN = 16;
export const MINIMAP_PADDING_Y = 8;

export const EXPANDED_MAP_HEIGHT_RATIO = 0.75;
export const EXPANDED_MAP_ASPECT_RATIO = 600 / 500;

export const getExpandedMapDimensions = () => {
  const height = Math.min(window.innerHeight * EXPANDED_MAP_HEIGHT_RATIO, 700);
  const width = height * EXPANDED_MAP_ASPECT_RATIO;
  return { width: Math.round(width), height: Math.round(height) };
};

export interface LocationArea {
  name: string;
  roomId: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const LOCATION_AREAS: LocationArea[] = [
  { name: "로비", roomId: "lobby", x: 497, y: 855, width: 951, height: 520 },
  { name: "데스크존", roomId: "desk zone", x: 506, y: 28, width: 939, height: 826 },
  { name: "iOS 세미나실", roomId: "seminar (ios)", x: 13, y: 874, width: 484, height: 235 },
  { name: "안드로이드 세미나실", roomId: "seminar (android)", x: 11, y: 1129, width: 485, height: 235 },
  { name: "식당", roomId: "restaurant", x: 1457, y: 874, width: 550, height: 236 },
  { name: "모각코", roomId: "mogakco", x: 1456, y: 1128, width: 550, height: 236 },
  { name: "세미나 라운지", roomId: "seminar (lounge)", x: 987, y: 1376, width: 779, height: 357 },
  { name: "웹 세미나실", roomId: "seminar (web)", x: 347, y: 1377, width: 618, height: 357 },
  { name: "Web(1-10)", roomId: "meeting (web 1-10)", x: 704, y: 965, width: 128, height: 135 },
  { name: "Web(11-20)", roomId: "meeting (web 11-20)", x: 912, y: 965, width: 128, height: 135 },
  { name: "Web(21-30)", roomId: "meeting (web 21-30)", x: 1120, y: 965, width: 128, height: 135 },
  { name: "Android(1-3)", roomId: "meeting (android 1-3)", x: 704, y: 1158, width: 128, height: 135 },
  { name: "iOS(1-5)", roomId: "meeting (ios 1-5)", x: 912, y: 1158, width: 128, height: 135 },
  { name: "모여방", roomId: "moyo", x: 1120, y: 1158, width: 128, height: 135 },
];
