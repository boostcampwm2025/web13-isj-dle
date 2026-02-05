import { useMemo } from "react";

import { useLocalParticipantPermissions } from "@livekit/components-react";

import type { ControlBar } from "./control-bar.types";
import { trackSourceToProtocol } from "./utils";
import { Track } from "livekit-client";

export const useVisibleControls = () => {
  const localPermissions = useLocalParticipantPermissions();

  const visibleControls: ControlBar = useMemo(() => {
    const controls: ControlBar = { leave: false };

    if (!localPermissions) {
      controls.camera = false;
      controls.chat = false;
      controls.microphone = false;
      controls.screenShare = false;
    } else {
      const canPublishSource = (source: Track.Source) => {
        return (
          localPermissions.canPublish &&
          (localPermissions.canPublishSources.length === 0 ||
            localPermissions.canPublishSources.includes(trackSourceToProtocol(source)))
        );
      };
      controls.camera ??= canPublishSource(Track.Source.Camera);
      controls.microphone ??= canPublishSource(Track.Source.Microphone);
      controls.screenShare ??= canPublishSource(Track.Source.ScreenShare);
    }

    return controls;
  }, [localPermissions]);

  return visibleControls;
};
