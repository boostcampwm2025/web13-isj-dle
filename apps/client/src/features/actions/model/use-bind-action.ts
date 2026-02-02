import { useActionStore } from "./action.store";
import { useCameraAction } from "./use-camera.action";
import { useDeskZoneAction } from "./use-desk-zone.action";
import { useLeaveAction } from "./use-leave.action";
import { useMicAction } from "./use-mic.action";
import { useScreenShareAction } from "./use-screen-share.action";
import { useViewModeAction } from "./use-view-mode.action";

import { useEffect, useMemo } from "react";

export const useBindAction = () => {
  const camera = useCameraAction();
  const mic = useMicAction();
  const screenShare = useScreenShareAction();
  const deskZone = useDeskZoneAction();
  const leave = useLeaveAction();
  const viewMode = useViewModeAction();

  const actions = useMemo(
    () => ({
      camera,
      mic,
      screen_share: screenShare,
      desk_zone: deskZone,
      leave,
      view_mode: viewMode,
    }),
    [camera, mic, screenShare, deskZone, leave, viewMode],
  );

  const setActions = useActionStore((s) => s.setActions);

  useEffect(() => {
    setActions(actions);
  }, [actions, setActions]);

  return null;
};
