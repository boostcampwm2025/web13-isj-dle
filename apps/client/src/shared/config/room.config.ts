export const MEETING_ROOM_RANGES = [
  "meeting (web 1-10)",
  "meeting (web 11-20)",
  "meeting (web 21-30)",
  "meeting (ios 1-5)",
  "meeting (android 1-3)",
] as const;

export type MeetingRoomRange = (typeof MEETING_ROOM_RANGES)[number];

export const getRoomNumbers = (roomRange: string): string[] => {
  if (roomRange === "meeting (web 1-10)") {
    return Array.from({ length: 10 }, (_, i) => `meeting (web ${i + 1})`);
  } else if (roomRange === "meeting (web 11-20)") {
    return Array.from({ length: 10 }, (_, i) => `meeting (web ${i + 11})`);
  } else if (roomRange === "meeting (web 21-30)") {
    return Array.from({ length: 10 }, (_, i) => `meeting (web ${i + 21})`);
  } else if (roomRange === "meeting (ios 1-5)") {
    return Array.from({ length: 5 }, (_, i) => `meeting (ios ${i + 1})`);
  } else if (roomRange === "meeting (android 1-3)") {
    return Array.from({ length: 3 }, (_, i) => `meeting (android ${i + 1})`);
  }
  return [];
};

export const isMeetingRoomRange = (roomId: string): boolean => {
  return MEETING_ROOM_RANGES.includes(roomId as MeetingRoomRange);
};
