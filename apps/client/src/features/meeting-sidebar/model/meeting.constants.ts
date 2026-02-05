import type { ComponentType } from "react";

import DailyScrum from "../ui/DailyScrum";
import Retrospection from "../ui/Retrospection";

export type Mode = "daily_scrum" | "retrospection";
export const MODES: Mode[] = ["daily_scrum", "retrospection"];

export type ModeContent = {
  title: string;
  Panel: ComponentType;
};

export const MODE_LABELS: Record<Mode, ModeContent> = {
  daily_scrum: {
    title: "데일리 스크럼",
    Panel: DailyScrum,
  },
  retrospection: {
    title: "회고",
    Panel: Retrospection,
  },
};

export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS = 20;
