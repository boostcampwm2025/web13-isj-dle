import type { LucideIcon } from "lucide-react";

import type { AvatarDirection, RoomType } from "@shared/types";

export type MovableRoom = Extract<
  RoomType,
  | "lobby"
  | "desk zone"
  | "meeting (web 1-10)"
  | "meeting (web 11-20)"
  | "meeting (web 21-30)"
  | "meeting (android 1-3)"
  | "meeting (ios 1-5)"
  | "moyo"
  | "mogakco"
  | "restaurant"
  | "seminar (web)"
  | "seminar (android)"
  | "seminar (ios)"
  | "seminar (lounge)"
>;

export type RoomPosition = { x: number; y: number; direction: AvatarDirection };

export type MoveRoom = {
  name: string;
  icon: LucideIcon;
  position: RoomPosition;
};
