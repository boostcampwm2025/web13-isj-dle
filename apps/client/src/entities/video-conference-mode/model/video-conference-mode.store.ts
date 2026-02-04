import { create } from "zustand";

import type { VideoConferenceMode } from "@shared/config";

interface VideoConferenceModeState {
  mode: VideoConferenceMode | null;
  setMode: (mode: VideoConferenceMode | null) => void;
}

export const useVideoConferenceModeStore = create<VideoConferenceModeState>((set) => ({
  mode: null,
  setMode: (mode) => set({ mode }),
}));
