import type { LucideIcon } from "lucide-react";

import type { ComponentType } from "react";

export type SidebarKey = "users" | "notices" | "chat";

export type SidebarItem = {
  title: string;
  Icon: LucideIcon;
  Panel: ComponentType;
};
