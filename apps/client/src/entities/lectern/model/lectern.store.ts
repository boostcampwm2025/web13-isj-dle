import { create } from "zustand";

import type { LecternState } from "@shared/types";

interface LecternStore extends LecternState {
  setLecternState: (state: Partial<LecternState>) => void;
  reset: () => void;
}

export const useLecternStore = create<LecternStore>((set) => ({
  hostSocketId: null,
  usersOnLectern: [],
  roomId: null,

  setLecternState: (state) => set(state),
  reset: () => set({ hostSocketId: null, usersOnLectern: [], roomId: null }),
}));
