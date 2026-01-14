import type { LocalParticipant } from "livekit-client";

import type { ReactNode } from "react";

export type ActionKey = "camera" | "mic" | "screen_share" | "desk_zone" | "ai_note" | "leave" | "view_mode";

export type ActionHook = () => {
  isOn?: boolean;
  title: string;
  icon: ReactNode;
  handleClick: () => void;
  setLocalParticipant?: (participant: LocalParticipant | null) => void;
  setTrigger?: (trigger: (() => void) | null) => void;
};
