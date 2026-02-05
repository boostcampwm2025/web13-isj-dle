import { useEffect } from "react";

import { useLocalParticipant } from "@livekit/components-react";

import { useActionStore } from "./action.store";

export const useBindLocalParticipant = () => {
  const actions = useActionStore((state) => state.actions);
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const micHook = actions.mic;
    const cameraHook = actions.camera;
    const screenShareHook = actions.screen_share;
    if (!micHook || !cameraHook || !screenShareHook) return;

    const { setLocalParticipant: setMicLocalParticipant } = micHook;
    const { setLocalParticipant: setCameraLocalParticipant } = cameraHook;
    const { setLocalParticipant: setScreenShareLocalParticipant } = screenShareHook;

    setMicLocalParticipant?.(localParticipant);
    setCameraLocalParticipant?.(localParticipant);
    setScreenShareLocalParticipant?.(localParticipant);

    return () => {
      setMicLocalParticipant?.(null);
      setCameraLocalParticipant?.(null);
      setScreenShareLocalParticipant?.(null);
    };
  }, [actions, localParticipant]);

  return null;
};
