import { useEffect } from "react";

import { useActionStore } from "@features/actions";
import { type ActionKey, VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@shared/config";

import { useBottomNavStore } from "./bottom-nav.store";

export const useBottomNav = (mode: VideoConferenceMode, setMode: (mode: VideoConferenceMode) => void) => {
  const addBottomNavKey = useBottomNavStore((state) => state.addKey);
  const removeBottomNavKey = useBottomNavStore((state) => state.removeKey);
  const actions = useActionStore((state) => state.actions);

  useEffect(() => {
    const actionKey: ActionKey = "view_mode";
    const viewModeHook = actions[actionKey];
    if (mode === VIDEO_CONFERENCE_MODE.THUMBNAIL) {
      addBottomNavKey(actionKey);
      viewModeHook?.setTrigger?.(() => setMode(VIDEO_CONFERENCE_MODE.FULL_GRID));
    } else {
      removeBottomNavKey(actionKey);
      viewModeHook?.setTrigger?.(null);
    }
  }, [addBottomNavKey, mode, removeBottomNavKey, actions, setMode]);
};
