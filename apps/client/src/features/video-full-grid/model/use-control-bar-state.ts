import { useCallback, useState } from "react";

export const useControlBarState = () => {
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

  const onScreenShareChange = useCallback((enabled: boolean) => {
    setIsScreenShareEnabled(enabled);
  }, []);

  return {
    isScreenShareEnabled,
    onScreenShareChange,
  };
};
