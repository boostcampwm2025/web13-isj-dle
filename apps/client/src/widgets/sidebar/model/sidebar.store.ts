import { create } from "zustand";

import type { SidebarKey } from "@shared/config";

interface SidebarState {
  sidebarKeys: SidebarKey[];
  isOpen: boolean;
  currentKey: SidebarKey | null;
  lastOpenedKey: SidebarKey;

  addKey: (key: SidebarKey) => void;
  removeKey: (key: SidebarKey) => void;
  setSidebarKeys: (keys: SidebarKey[]) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setCurrentKey: (key: SidebarKey | null) => void;
  openSidebarWithLastKey: () => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  sidebarKeys: ["users", "notices"],
  isOpen: true,
  currentKey: "users",
  lastOpenedKey: "users",

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
  toggleSidebar: () =>
    set((state) => {
      if (state.isOpen && state.currentKey) {
        return { isOpen: false, lastOpenedKey: state.currentKey };
      }
      return { isOpen: true, currentKey: state.lastOpenedKey };
    }),
  setCurrentKey: (key) => set({ currentKey: key, lastOpenedKey: key ?? get().lastOpenedKey }),
  openSidebarWithLastKey: () =>
    set((state) => ({
      isOpen: true,
      currentKey: state.lastOpenedKey,
    })),
}));
