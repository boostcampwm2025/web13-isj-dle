import type { ActionHook, ActionKey } from "./action.types";
import { ActionContext } from "./use-action";
import { useAiNoteAction } from "./use-ai-note.action";
import { useCameraAction } from "./use-camera.action";
import { useDeskZoneAction } from "./use-desk-zone.action";
import { useLeaveAction } from "./use-leave.action";
import { useMicAction } from "./use-mic.action";
import { useScreenShareAction } from "./use-screen-share.action";
import { useViewModeAction } from "./use-view-mode.action";

import type { ReactNode } from "react";

interface ActionProviderProps {
  children: ReactNode;
}

const ActionProvider = ({ children }: ActionProviderProps) => {
  const actions: Record<ActionKey, ReturnType<ActionHook>> = {
    ai_note: useAiNoteAction(),
    camera: useCameraAction(),
    mic: useMicAction(),
    screen_share: useScreenShareAction(),
    desk_zone: useDeskZoneAction(),
    leave: useLeaveAction(),
    view_mode: useViewModeAction(),
  };

  const getHookByKey = (key: ActionKey): ReturnType<ActionHook> => {
    return actions[key];
  };

  return <ActionContext.Provider value={{ getHookByKey }}>{children}</ActionContext.Provider>;
};

export default ActionProvider;
