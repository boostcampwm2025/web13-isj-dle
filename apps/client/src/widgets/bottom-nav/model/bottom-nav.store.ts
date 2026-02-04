import { create } from "zustand";

import type { ActionKey } from "@shared/config";

interface BottomNavState {
  bottomNavigation: ActionKey[];

  addKey: (key: ActionKey) => void;
  removeKey: (key: ActionKey) => void;
  setBottomNavigation: (keys: ActionKey[]) => void;
}

export const useBottomNavStore = create<BottomNavState>((set) => ({
  bottomNavigation: ["mic", "camera", "screen_share", "desk_zone", "logout"],

  addKey: (key) =>
    set((state) => ({
      bottomNavigation: state.bottomNavigation.includes(key)
        ? state.bottomNavigation
        : [...state.bottomNavigation, key],
    })),

  removeKey: (key) =>
    set((state) => ({
      bottomNavigation: state.bottomNavigation.includes(key)
        ? state.bottomNavigation.filter((k) => k !== key)
        : state.bottomNavigation,
    })),

  setBottomNavigation: (keys) => set({ bottomNavigation: keys }),
}));
