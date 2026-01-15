import type { ActionHook, ActionKey } from "./action.types";

import { createContext, useContext } from "react";

interface ActionContextType {
  getHookByKey: (key: ActionKey) => ReturnType<ActionHook>;
}

export const ActionContext = createContext<ActionContextType | null>(null);

export const useAction = () => {
  const context = useContext(ActionContext);

  if (!context) {
    throw new Error("useAction must be used within ActionProvider");
  }

  return context;
};
