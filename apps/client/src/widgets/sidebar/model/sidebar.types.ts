import type { LucideIcon } from "lucide-react";

import type { ComponentType } from "react";

export type SidebarKey = "users" | "notices" | "whiteboard" | "code-editor";

export type SidebarItem = {
  title: string;
  Icon: LucideIcon;
  Panel: ComponentType;
};
