import { useEffect } from "react";

import { useLocalParticipant } from "@livekit/components-react";

import { useActionStore } from "./action.store";

export const useBindLocalParticipant = () => {
  const getHookByKey = useActionStore((state) => state.getHookByKey);
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const micHook = getHookByKey("mic");
    const cameraHook = getHookByKey("camera");
    const screenShareHook = getHookByKey("screen_share");
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
  }, [getHookByKey, localParticipant]);

  return null;
};
