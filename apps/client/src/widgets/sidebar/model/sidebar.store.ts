import { create } from "zustand";

import type { SidebarKey } from "@shared/config";

const SIDEBAR_KEY_ORDER: Record<SidebarKey, number> = {
  users: 0,
  notices: 1,
  guide: 2,
  chat: 3,
  "code-editor": 4,
  whiteboard: 5,
  "timer-stopwatch": 6,
  participant: 7,
  host: 8,
  deskZone: 9,
};

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
  sidebarKeys: ["users", "notices", "guide"],
  isOpen: true,
  currentKey: "guide",
  lastOpenedKey: "users",

  addKey: (key) =>
    set((state) => {
      if (state.sidebarKeys.includes(key)) return state;
      const newKeys = [...state.sidebarKeys, key].sort(
        (a, b) => (SIDEBAR_KEY_ORDER[a] ?? 99) - (SIDEBAR_KEY_ORDER[b] ?? 99),
      );
      return { sidebarKeys: newKeys };
    }),

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
