import { useCallback, useMemo } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { usePersistentUserChoices } from "@livekit/components-react";
import { UserEventType } from "@shared/types";

export const useSyncMediaToggle = () => {
  const { socket } = useWebSocket();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const { saveAudioInputEnabled, saveVideoInputEnabled, saveAudioInputDeviceId, saveVideoInputDeviceId } =
    usePersistentUserChoices({ preventSave: false });

  const handleMediaToggle = useCallback(
    (type: "mic" | "camera") => (enabled: boolean, isUserInitiated: boolean) => {
      if (!isUserInitiated) return;

      if (type === "mic") saveAudioInputEnabled(enabled);
      else saveVideoInputEnabled(enabled);

      const updatePayload = type === "mic" ? { micOn: enabled } : { cameraOn: enabled };

      if (user) updateUser({ id: user.id, ...updatePayload });
      socket?.emit(UserEventType.USER_UPDATE, updatePayload);
    },
    [saveAudioInputEnabled, saveVideoInputEnabled, socket, user, updateUser],
  );

  const microphoneOnChange = useMemo(() => handleMediaToggle("mic"), [handleMediaToggle]);
  const cameraOnChange = useMemo(() => handleMediaToggle("camera"), [handleMediaToggle]);

  return {
    microphoneOnChange,
    cameraOnChange,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  };
};
