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

export const VIDEO_CONFERENCE_MODE = {
  FULL_GRID: "full-grid",
  THUMBNAIL: "thumbnail",
} as const;

export type VideoConferenceMode = (typeof VIDEO_CONFERENCE_MODE)[keyof typeof VIDEO_CONFERENCE_MODE] | null;

export interface VideoConferenceConfig {
  defaultMode: VideoConferenceMode;
  sittingMode?: VideoConferenceMode;
}

const VIDEO_CONFERENCE_CONFIG_MAP: Record<string, VideoConferenceConfig> = {
  meeting: {
    defaultMode: VIDEO_CONFERENCE_MODE.FULL_GRID,
  },
  seminar: {
    defaultMode: VIDEO_CONFERENCE_MODE.THUMBNAIL,
    sittingMode: VIDEO_CONFERENCE_MODE.FULL_GRID,
  },
  lobby: {
    defaultMode: null,
  },
};

export const getVideoConferenceConfig = (roomId: string | undefined): VideoConferenceConfig | null => {
  if (!roomId) return null;

  if (VIDEO_CONFERENCE_CONFIG_MAP[roomId]) {
    return VIDEO_CONFERENCE_CONFIG_MAP[roomId];
  }

  for (const [key, config] of Object.entries(VIDEO_CONFERENCE_CONFIG_MAP)) {
    if (roomId.startsWith(key)) {
      return config;
    }
  }

  return null;
};

export const getVideoConferenceMode = (roomId: string | undefined, isSitting: boolean = false): VideoConferenceMode => {
  const config = getVideoConferenceConfig(roomId);
  if (!config) return null;

  if (roomId && isMeetingRoomRange(roomId)) {
    return VIDEO_CONFERENCE_MODE.THUMBNAIL;
  }

  if (isSitting && config.sittingMode) {
    return config.sittingMode;
  }

  return config.defaultMode;
};

export const isVideoConferenceRoom = (roomId: string | undefined): boolean => {
  const config = getVideoConferenceConfig(roomId);
  return config !== null && config.defaultMode !== null;
};

export function getVideoRoomClassName(mode: VideoConferenceMode): string {
  switch (mode) {
    case VIDEO_CONFERENCE_MODE.FULL_GRID:
      return "fixed inset-0 z-[9999] bg-black";
    case VIDEO_CONFERENCE_MODE.THUMBNAIL:
      return "fixed top-5 right-5 w-96 h-72 z-[9999] bg-black rounded-lg shadow-2xl overflow-hidden";
    default:
      return "";
  }
}
