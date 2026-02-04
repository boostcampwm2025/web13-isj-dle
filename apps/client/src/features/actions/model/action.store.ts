import { create } from "zustand";

import type { ActionHook, ActionKey } from "@shared/config";

type ActionsMap = Record<ActionKey, ReturnType<ActionHook>>;

interface ActionState {
  actions: Partial<ActionsMap>;
  setActions: (actions: ActionsMap) => void;
  getHookByKey: (key: ActionKey) => ReturnType<ActionHook> | undefined;
}

export const useActionStore = create<ActionState>((set, get) => ({
  actions: {},
  setActions: (actions) => set({ actions }),
  getHookByKey: (key) => get().actions[key],
}));
