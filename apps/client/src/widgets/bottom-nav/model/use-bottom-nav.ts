import { useBottomNavStore } from "./bottom-nav.store";

import { useEffect } from "react";

import { type ActionKey, useActionStore } from "@features/actions";
import { VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@shared/config";

export const useBottomNav = (mode: VideoConferenceMode, setMode: (mode: VideoConferenceMode) => void) => {
  const getHookByKey = useActionStore((state) => state.getHookByKey);
  const addBottomNavKey = useBottomNavStore((state) => state.addKey);
  const removeBottomNavKey = useBottomNavStore((state) => state.removeKey);

  useEffect(() => {
    const actionKey: ActionKey = "view_mode";
    const viewModeHook = getHookByKey(actionKey);
    if (mode === VIDEO_CONFERENCE_MODE.THUMBNAIL) {
      addBottomNavKey(actionKey);
      viewModeHook?.setTrigger?.(() => setMode(VIDEO_CONFERENCE_MODE.FULL_GRID));
    } else {
      removeBottomNavKey(actionKey);
      viewModeHook?.setTrigger?.(null);
    }
  }, [addBottomNavKey, mode, removeBottomNavKey, getHookByKey, setMode]);
};
