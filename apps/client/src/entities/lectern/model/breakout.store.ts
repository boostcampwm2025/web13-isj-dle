import type { BreakoutState } from "@shared/types";

import { create } from "zustand";

interface BreakoutStore {
  breakoutState: BreakoutState | null;
  setBreakoutState: (state: BreakoutState | null) => void;
  reset: () => void;
}

export const useBreakoutStore = create<BreakoutStore>((set) => ({
  breakoutState: null,

  setBreakoutState: (state) => set({ breakoutState: state }),
  reset: () => set({ breakoutState: null }),
}));
