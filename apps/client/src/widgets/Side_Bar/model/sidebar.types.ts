import type { ReactNode } from "react";

export type SidebarKey = "users";

export type SidebarItem = {
  title: string;
  icon: ReactNode;
  Panel: ReactNode;
};
