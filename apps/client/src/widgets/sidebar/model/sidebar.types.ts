import type { ReactNode } from "react";

export type SidebarKey = "users" | "notices";

export type SidebarItem = {
  title: string;
  icon: ReactNode;
  Panel: ReactNode;
};
