import type { UserStopwatchState } from "@shared/types";

import { create } from "zustand";

interface StopwatchShareState {
  userStopwatches: UserStopwatchState[];
  setUserStopwatches: (users: UserStopwatchState[]) => void;
  clearUserStopwatches: () => void;
}

export const useStopwatchShareStore = create<StopwatchShareState>((set) => ({
  userStopwatches: [],
  setUserStopwatches: (users) => set({ userStopwatches: users }),
  clearUserStopwatches: () => set({ userStopwatches: [] }),
}));
