import type { ReactNode } from "react";

export type BottomNavKey = "camera" | "mic" | "screen_share" | "desk_zone" | "ai_note" | "leave";

export type BottomNavHook = () => {
  isOn?: boolean;
  title: string;
  icon: ReactNode;
  handleClick: () => void;
};
