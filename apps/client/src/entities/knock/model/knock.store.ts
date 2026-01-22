import { create } from "zustand";

import type { Knock } from "@shared/types";

interface KnockState {
  receivedKnocks: Knock[];
  sentKnockTargets: string[];
  knockFailedMessage: string | null;
  addReceivedKnock: (knock: Knock) => void;
  removeReceivedKnock: (fromUserId: string) => void;
  addSentKnock: (targetUserId: string) => void;
  removeSentKnock: (targetUserId: string) => void;
  setKnockFailedMessage: (message: string | null) => void;
  clearAllKnocks: () => void;
}

export const useKnockStore = create<KnockState>((set) => ({
  receivedKnocks: [],
  sentKnockTargets: [],
  knockFailedMessage: null,

  addReceivedKnock: (knock) =>
    set((state) => {
      const exists = state.receivedKnocks.some((k) => k.fromUserId === knock.fromUserId);
      if (exists) return state;

      return {
        receivedKnocks: [...state.receivedKnocks, knock],
      };
    }),

  removeReceivedKnock: (fromUserId) =>
    set((state) => ({
      receivedKnocks: state.receivedKnocks.filter((k) => k.fromUserId !== fromUserId),
    })),

  addSentKnock: (targetUserId) =>
    set((state) => ({
      sentKnockTargets: [...state.sentKnockTargets, targetUserId],
    })),

  removeSentKnock: (targetUserId) =>
    set((state) => ({
      sentKnockTargets: state.sentKnockTargets.filter((id) => id !== targetUserId),
    })),

  setKnockFailedMessage: (message) => set({ knockFailedMessage: message }),

  clearAllKnocks: () =>
    set({
      receivedKnocks: [],
      sentKnockTargets: [],
    }),
}));
