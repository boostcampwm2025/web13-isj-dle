export const METRIC_ROOM_TYPES = {
  LOBBY: "lobby",
  DESK_ZONE: "desk_zone",
  MOGAKCO: "mogakco",
  RESTAURANT: "restaurant",
  SEMINAR: "seminar",
  MEETING: "meeting",
  OTHER: "other",
} as const;

export type MetricRoomType = (typeof METRIC_ROOM_TYPES)[keyof typeof METRIC_ROOM_TYPES];

export const KNOWN_ROOM_TYPES: MetricRoomType[] = Object.values(METRIC_ROOM_TYPES);

export function mapRoomIdToMetricType(roomId: string): MetricRoomType {
  if (roomId === "lobby") return METRIC_ROOM_TYPES.LOBBY;
  if (roomId === "desk zone") return METRIC_ROOM_TYPES.DESK_ZONE;
  if (roomId === "mogakco") return METRIC_ROOM_TYPES.MOGAKCO;
  if (roomId === "restaurant") return METRIC_ROOM_TYPES.RESTAURANT;
  if (roomId.startsWith("seminar")) return METRIC_ROOM_TYPES.SEMINAR;
  if (roomId.startsWith("meeting")) return METRIC_ROOM_TYPES.MEETING;
  return METRIC_ROOM_TYPES.OTHER;
}
