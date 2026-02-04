import { type LocalParticipant, ParticipantEvent } from "livekit-client";
import { ScreenShare, ScreenShareOff } from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ActionHook } from "@shared/config";

export const useScreenShareAction: ActionHook = () => {
  const [isScreenShareOn, setIsScreenShareOn] = useState<boolean>(false);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);

  useEffect(() => {
    if (!localParticipant) return;

    const updateScreenShareState = () => {
      setIsScreenShareOn(localParticipant.isScreenShareEnabled);
    };

    updateScreenShareState();

    localParticipant.on(ParticipantEvent.LocalTrackPublished, updateScreenShareState);
    localParticipant.on(ParticipantEvent.LocalTrackUnpublished, updateScreenShareState);

    return () => {
      localParticipant.off(ParticipantEvent.LocalTrackPublished, updateScreenShareState);
      localParticipant.off(ParticipantEvent.LocalTrackUnpublished, updateScreenShareState);
    };
  }, [localParticipant]);

  const toggleScreenShare = useCallback(async () => {
    const newState = !isScreenShareOn;
    await localParticipant?.setScreenShareEnabled(newState);
  }, [isScreenShareOn, localParticipant]);

  const title = useMemo(() => (isScreenShareOn ? "화면 공유 끄기" : "화면 공유 켜기"), [isScreenShareOn]);
  const icon = useMemo(() => {
    return isScreenShareOn ? <ScreenShare color="green" /> : <ScreenShareOff color="red" />;
  }, [isScreenShareOn]);

  return useMemo(
    () => ({
      title,
      isOn: isScreenShareOn,
      icon,
      handleClick: toggleScreenShare,
      setLocalParticipant,
    }),
    [title, isScreenShareOn, icon, toggleScreenShare, setLocalParticipant],
  );
};
