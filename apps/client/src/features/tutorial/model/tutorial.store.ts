import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface TutorialState {
  isCompleted: boolean;
  currentStep: number;
  isActive: boolean;
  setCompleted: (completed: boolean) => void;
  setCurrentStep: (step: number) => void;
  setActive: (active: boolean) => void;
  reset: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  subscribeWithSelector((set) => ({
    isCompleted: false,
    currentStep: 0,
    isActive: false,
    setCompleted: (completed) => set({ isCompleted: completed }),
    setCurrentStep: (step) => set({ currentStep: step }),
    setActive: (active) => set({ isActive: active }),
    reset: () => set({ isCompleted: false, currentStep: 0, isActive: false }),
  })),
);
