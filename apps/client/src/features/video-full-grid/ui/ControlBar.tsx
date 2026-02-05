import { useMemo } from "react";

import { MediaDeviceMenu, StartMediaButton, TrackToggle } from "@livekit/components-react";
import { VIDEO_CONFERENCE_MODE, type VideoConferenceMode } from "@shared/config";

import { useControlBarState } from "../model/use-control-bar-state";
import { useMediaQuery } from "../model/use-media-query";
import { useSyncMediaToggle } from "../model/use-sync-media-toggle";
import { useVisibleControls } from "../model/use-visible-controls";
import { supportsScreenSharing } from "../model/utils";
import { Track } from "livekit-client";
import { Minimize } from "lucide-react";

interface ControlBarProps {
  variation?: "minimal" | "verbose" | "textOnly";
  setMode: (mode: VideoConferenceMode | null) => void;
}

const ControlBar = ({ variation, setMode }: ControlBarProps) => {
  const { isScreenShareEnabled } = useControlBarState();
  const { microphoneOnChange, cameraOnChange, saveAudioInputDeviceId, saveVideoInputDeviceId } = useSyncMediaToggle();
  const browserSupportsScreenSharing = supportsScreenSharing();
  const visibleControls = useVisibleControls();
  const isTooLittleSpace = useMediaQuery(`(max-width: 760px)`);

  const defaultVariation = isTooLittleSpace ? "minimal" : "verbose";
  variation ??= defaultVariation;

  const showIcon = useMemo(() => variation === "minimal" || variation === "verbose", [variation]);
  const showText = useMemo(() => variation === "textOnly" || variation === "verbose", [variation]);

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
