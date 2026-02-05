import type { ActionHook, ActionKey } from "@shared/config";

import { create } from "zustand";

type ActionsMap = Record<ActionKey, ReturnType<ActionHook>>;

interface ActionState {
  actions: Partial<ActionsMap>;
  setActions: (actions: ActionsMap) => void;
}

export const useActionStore = create<ActionState>((set) => ({
  actions: {},
  setActions: (actions) => set({ actions }),
}));
