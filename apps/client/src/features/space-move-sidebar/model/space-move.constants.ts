import { MEETING_ROOM_RANGES, getRoomNumbers } from "@shared/config";
import type { RoomType } from "@shared/types";

import type { MovableRoom, MoveRoom } from "./space-move.types";
import {
  Apple,
  Briefcase,
  Coffee,
  Compass,
  Home,
  MessageCircle,
  Presentation,
  Smartphone,
  Users,
  Utensils,
} from "lucide-react";

export const MOVE_ROOM_MAP: Record<MovableRoom, MoveRoom> = {
  lobby: {
    name: "로비",
    icon: Home,
    position: { x: 600, y: 968, direction: "down" },
  },
  "desk zone": {
    name: "데스크존",
    icon: Briefcase,
    position: { x: 984, y: 888, direction: "up" },
  },
  "meeting (web 1-10)": {
    name: "웹 회의실 1-10",
    icon: Users,
    position: { x: 680, y: 1032, direction: "right" },
  },
  "meeting (web 11-20)": {
    name: "웹 회의실 11-20",
    icon: Users,
    position: { x: 888, y: 1032, direction: "right" },
  },
  "meeting (web 21-30)": {
    name: "웹 회의실 21-30",
    icon: Users,
    position: { x: 1096, y: 1032, direction: "right" },
  },
  "meeting (android 1-3)": {
    name: "안드로이드 회의실 1-3",
    icon: Smartphone,
    position: { x: 680, y: 1224, direction: "right" },
  },
  "meeting (ios 1-5)": {
    name: "iOS 회의실 1-5",
    icon: Apple,
    position: { x: 888, y: 1224, direction: "right" },
  },
  moyo: {
    name: "모여방",
    icon: MessageCircle,
    position: { x: 1096, y: 1224, direction: "right" },
  },
  mogakco: {
    name: "모각코",
    icon: Coffee,
    position: { x: 1432, y: 1256, direction: "right" },
  },
  restaurant: {
    name: "식당",
    icon: Utensils,
    position: { x: 1432, y: 1000, direction: "right" },
  },
  "seminar (web)": {
    name: "웹 세미나실",
    icon: Presentation,
    position: { x: 904, y: 1352, direction: "down" },
  },
  "seminar (android)": {
    name: "안드로이드 세미나실",
    icon: Presentation,
    position: { x: 520, y: 1256, direction: "left" },
  },
  "seminar (ios)": {
    name: "iOS 세미나실",
    icon: Presentation,
    position: { x: 520, y: 1000, direction: "left" },
  },
  "seminar (lounge)": {
    name: "세미나 라운지",
    icon: Compass,
    position: { x: 1048, y: 1352, direction: "down" },
  },
};

export const isSameRoom = (currentRoomId: RoomType, room: MovableRoom) => {
  const match = currentRoomId.match(/^meeting\s*\((web|ios|android)\s+(\d+)\)$/);
  if (!match) return currentRoomId === room;

  for (const room_range of MEETING_ROOM_RANGES) {
    const rooms = getRoomNumbers(room_range);
    if (!rooms.includes(currentRoomId)) continue;
    return room_range === room;
  }

  return false;
};
