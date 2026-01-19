import { Check, VolumeX } from "lucide-react";

import { useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

export const MuteAllButton = () => {
  const { socket } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleMuteAll = () => {
    if (!socket || !user) return;

    socket.emit(LecternEventType.MUTE_ALL, { roomId: user.avatar.currentRoomId }, (response: { success: boolean }) => {
      if (response.success) {
        setIsSuccess(true);
      }
    });
  };
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return (
    <button
      onClick={handleMuteAll}
      disabled={isSuccess}
      className={`group flex items-center gap-5 rounded-lg border px-4 py-3 transition-all duration-300 active:scale-[0.98] ${
        isSuccess
          ? "border-green-200 bg-green-50 hover:border-green-200 hover:bg-green-50"
          : "border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100 hover:shadow-sm"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-all duration-300 ${
          isSuccess ? "bg-green-500 group-hover:bg-green-500" : "bg-red-500 group-hover:bg-red-600"
        }`}
      >
        {isSuccess ? <Check className="animate-in zoom-in-50 h-5 w-5 duration-200" /> : <VolumeX className="h-5 w-5" />}
      </div>
      <div className="flex flex-col">
        <span
          className={`text-sm font-semibold transition-colors duration-300 ${
            isSuccess ? "text-green-900" : "text-red-900"
          }`}
        >
          {isSuccess ? "음소거 완료" : "전체 음소거"}
        </span>
      </div>
    </button>
  );
};
