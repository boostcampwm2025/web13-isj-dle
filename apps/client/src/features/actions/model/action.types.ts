import type { ReactNode } from "react";

export type ActionKey = "camera" | "mic" | "screen_share" | "desk_zone" | "ai_note" | "leave";

export type ActionHook = () => {
  isOn?: boolean;
  title: string;
  icon: ReactNode;
  handleClick: () => void;
};
