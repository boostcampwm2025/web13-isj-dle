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
      className="group flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 transition-all hover:border-red-300 hover:bg-red-100 hover:shadow-sm active:scale-[0.98]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white transition-colors group-hover:bg-red-600">
        <VolumeX className="h-5 w-5" />
      </div>
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-sm font-semibold text-red-900">전체 음소거</span>
      </div>
    </button>
  );
};
