import { DEFAULT_ZOOM_INDEX, ZOOM_LEVELS, ZOOM_PERCENTAGES } from "./zoom.constants";
import { create } from "zustand";

interface ZoomState {
  zoomIndex: number;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomIndex: (index: number) => void;
  getZoomLevel: () => number;
  getZoomPercentage: () => number;
}

export const useZoomStore = create<ZoomState>((set, get) => ({
  zoomIndex: DEFAULT_ZOOM_INDEX,

  zoomIn: () =>
    set((state) => ({
      zoomIndex: Math.min(ZOOM_LEVELS.length - 1, state.zoomIndex + 1),
    })),

  zoomOut: () =>
    set((state) => ({
      zoomIndex: Math.max(0, state.zoomIndex - 1),
    })),

  setZoomIndex: (index) =>
    set({
      zoomIndex: Math.max(0, Math.min(ZOOM_LEVELS.length - 1, index)),
    }),

  getZoomLevel: () => ZOOM_LEVELS[get().zoomIndex],

  getZoomPercentage: () => ZOOM_PERCENTAGES[get().zoomIndex],
}));
