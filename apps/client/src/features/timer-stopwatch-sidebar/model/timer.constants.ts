export type Mode = "timer" | "stopwatch";
export const MODES: Mode[] = ["timer", "stopwatch"];

export const ONE_SECOND = 1_000;
export const WARNING_SECONDS = 10;

export const MAX_HOURS = 99;
export const MAX_MINUTES = 59;
export const MAX_SECONDS = 59;

export const QUICK_TIMES = [
  { label: "+30초", seconds: 30 },
  { label: "+1분", seconds: 60 },
  { label: "+5분", seconds: 300 },
] as const;

export const MODE_LABELS: Record<Mode, string> = {
  timer: "타이머",
  stopwatch: "스톱워치",
};

export const CHIME_FREQUENCIES = {
  high: 880,
  low: 660,
} as const;

export const CHIME_DELAY = 0.18;

export const TIMER_BUTTON_STYLES = {
  running: "bg-red-500 hover:bg-red-600",
  stopped: "bg-blue-500 hover:bg-blue-600",
} as const;

export const TIMER_BUTTON_LABELS = {
  running: "정지",
  stopped: "시작",
} as const;

export const TIMER_ICON_SIZE = 16;
