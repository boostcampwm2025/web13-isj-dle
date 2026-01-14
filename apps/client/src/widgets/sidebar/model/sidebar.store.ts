import type { SidebarKey } from "./sidebar.types";
import { create } from "zustand";

interface SidebarState {
  sidebarKeys: SidebarKey[];
  isOpen: boolean;
  currentKey: SidebarKey | null;

  // Actions
  addKey: (key: SidebarKey) => void;
  removeKey: (key: SidebarKey) => void;
  setSidebarKeys: (keys: SidebarKey[]) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setCurrentKey: (key: SidebarKey | null) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarKeys: ["users", "notices"],
  isOpen: true,
  currentKey: "users",

  addKey: (key) =>
    set((state) => ({
      sidebarKeys: state.sidebarKeys.includes(key) ? state.sidebarKeys : [...state.sidebarKeys, key],
    })),

  removeKey: (key) =>
    set((state) => ({
      sidebarKeys: state.sidebarKeys.filter((k) => k !== key),
    })),

  setSidebarKeys: (keys) => set({ sidebarKeys: keys }),
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  setCurrentKey: (key) => set({ currentKey: key }),
}));
