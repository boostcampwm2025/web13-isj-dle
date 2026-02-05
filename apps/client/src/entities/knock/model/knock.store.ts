import type { Knock } from "@shared/types";

import { create } from "zustand";

interface KnockState {
  receivedKnocks: Knock[];
  sentKnockTargets: string[];
  knockFailedMessage: string | null;
  addReceivedKnock: (knock: Knock) => void;
  removeReceivedKnock: (fromSocketId: string) => void;
  addSentKnock: (targetSocketId: string) => void;
  removeSentKnock: (targetSocketId: string) => void;
  setKnockFailedMessage: (message: string | null) => void;
  clearAllKnocks: () => void;
}

export const useKnockStore = create<KnockState>((set) => ({
  receivedKnocks: [],
  sentKnockTargets: [],
  knockFailedMessage: null,

  addReceivedKnock: (knock) =>
    set((state) => {
      const exists = state.receivedKnocks.some((k) => k.fromSocketId === knock.fromSocketId);
      if (exists) return state;

      return {
        receivedKnocks: [...state.receivedKnocks, knock],
      };
    }),

  removeReceivedKnock: (fromSocketId) =>
    set((state) => ({
      receivedKnocks: state.receivedKnocks.filter((k) => k.fromSocketId !== fromSocketId),
    })),

  addSentKnock: (targetSocketId) =>
    set((state) => ({
      sentKnockTargets: [...state.sentKnockTargets, targetSocketId],
    })),

  removeSentKnock: (targetSocketId) =>
    set((state) => ({
      sentKnockTargets: state.sentKnockTargets.filter((id) => id !== targetSocketId),
    })),

  setKnockFailedMessage: (message) => set({ knockFailedMessage: message }),

  clearAllKnocks: () =>
    set({
      receivedKnocks: [],
      sentKnockTargets: [],
    }),
}));
