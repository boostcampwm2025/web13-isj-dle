import { create } from "zustand";

import type { ActionKey } from "@features/actions";

interface BottomNavState {
  bottomNavigation: ActionKey[];

  // Actions
  addKey: (key: ActionKey) => void;
  removeKey: (key: ActionKey) => void;
  setBottomNavigation: (keys: ActionKey[]) => void;
}

export const useBottomNavStore = create<BottomNavState>((set) => ({
  bottomNavigation: ["camera", "mic", "screen_share", "desk_zone", "ai_note", "leave"],

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
