import { VolumeX } from "lucide-react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const MuteAllButton = () => {
  const { socket } = useWebSocket();
  const user = useUserStore((state) => state.user);

  const handleMuteAll = () => {
    if (!socket || !user) return;

    socket.emit(LecternEventType.MUTE_ALL, {
      roomId: user.avatar.currentRoomId,
    });
  };
  return (
    <button
      onClick={handleMuteAll}
      className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
    >
      <VolumeX className="h-5 w-5" />
      전체 음소거
    </button>
  );
};
