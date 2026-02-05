import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

export type Space =
  | "desk_zone"
  | "lobby"
  | "mogakco"
  | "restaurant"
  | "seminar_android"
  | "seminar_ios"
  | "seminar_lounge"
  | "seminar_web";

export type SpaceContent = {
  url: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  items: ReactNode[];
};
