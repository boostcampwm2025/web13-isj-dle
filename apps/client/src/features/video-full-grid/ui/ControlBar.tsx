import { useControlBarState } from "../model/use-control-bar-state";
import { useVisibleControls } from "../model/use-visible-controls";
import { useMediaQuery } from "../model/useMediaQuery";
import { supportsScreenSharing } from "../model/utils";
import { Track } from "livekit-client";
import { Minimize } from "lucide-react";

import { useCallback, useMemo } from "react";

import { useUserStore } from "@entities/user";
import { MediaDeviceMenu, StartMediaButton, TrackToggle, usePersistentUserChoices } from "@livekit/components-react";
import { VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@shared/config";
import { useWebSocket } from "@shared/lib/websocket";
import { UserEventType } from "@shared/types";

interface ControlBarProps {
  variation?: "minimal" | "verbose" | "textOnly";
  setMode: (mode: VideoConferenceMode | null) => void;
}

const ControlBar = ({ variation, setMode }: ControlBarProps) => {
  const { onScreenShareChange, isScreenShareEnabled } = useControlBarState();
  const visibleControls = useVisibleControls();
  const isTooLittleSpace = useMediaQuery(`(max-width: 760px)`);
  const { socket } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);

  const defaultVariation = isTooLittleSpace ? "minimal" : "verbose";
  variation ??= defaultVariation;

  const showIcon = useMemo(() => variation === "minimal" || variation === "verbose", [variation]);
  const showText = useMemo(() => variation === "textOnly" || variation === "verbose", [variation]);

  const browserSupportsScreenSharing = supportsScreenSharing();

  const { saveAudioInputEnabled, saveVideoInputEnabled, saveAudioInputDeviceId, saveVideoInputDeviceId } =
    usePersistentUserChoices({ preventSave: false });

  const handleMediaToggle = useCallback(
    (type: "mic" | "camera") => (enabled: boolean, isUserInitiated: boolean) => {
      if (isUserInitiated) {
        if (type === "mic") {
          saveAudioInputEnabled(enabled);
        } else {
          saveVideoInputEnabled(enabled);
        }
        const updatePayload = type === "mic" ? { micOn: enabled } : { cameraOn: enabled };
        if (user) {
          updateUser({ id: user.id, ...updatePayload });
        }
        socket?.emit(UserEventType.USER_UPDATE, updatePayload);
      }
    },
    [saveAudioInputEnabled, saveVideoInputEnabled, socket, user, updateUser],
  );

  const microphoneOnChange = useMemo(() => handleMediaToggle("mic"), [handleMediaToggle]);
  const cameraOnChange = useMemo(() => handleMediaToggle("camera"), [handleMediaToggle]);

  return (
    <div className="lk-control-bar">
      {visibleControls.microphone && (
        <div className="lk-button-group">
          <TrackToggle source={Track.Source.Microphone} showIcon={showIcon} onChange={microphoneOnChange}>
            {showText && "Microphone"}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="audioinput"
              onActiveDeviceChange={(_kind, deviceId) => saveAudioInputDeviceId(deviceId ?? "default")}
            />
          </div>
        </div>
      )}
      {visibleControls.camera && (
        <div className="lk-button-group">
          <TrackToggle source={Track.Source.Camera} showIcon={showIcon} onChange={cameraOnChange}>
            {showText && "Camera"}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="videoinput"
              onActiveDeviceChange={(_kind, deviceId) => saveVideoInputDeviceId(deviceId ?? "default")}
            />
          </div>
        </div>
      )}
      {visibleControls.screenShare && browserSupportsScreenSharing && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{ audio: true, selfBrowserSurface: "include" }}
          showIcon={showIcon}
          onChange={onScreenShareChange}
        >
          {showText && (isScreenShareEnabled ? "Stop screen share" : "Share screen")}
        </TrackToggle>
      )}
      <button
        className="lk-button"
        onClick={() => {
          setMode(VIDEO_CONFERENCE_MODE.THUMBNAIL);
        }}
      >
        <Minimize />
      </button>
      <StartMediaButton />
    </div>
  );
};

export default ControlBar;
