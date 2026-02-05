import type { ReactNode } from "react";

import type { LocalParticipant } from "livekit-client";

export type ActionKey = "camera" | "mic" | "screen_share" | "desk_zone" | "leave" | "view_mode" | "logout";

export const ACTION_KEY_ORDER: Record<ActionKey, number> = {
  mic: 0,
  camera: 1,
  screen_share: 2,
  view_mode: 3,
  leave: 4,
  desk_zone: 11,
  logout: 12,
};

export const DIVIDER_INDEX = 10;

export type ActionHook = () => {
  isOn?: boolean;
  title: string;
  icon: ReactNode;
  handleClick: () => void;
  setLocalParticipant?: (participant: LocalParticipant | null) => void;
  setTrigger?: (trigger: (() => void) | null) => void;
  setGame?: (game: Phaser.Game | null) => void;
};
