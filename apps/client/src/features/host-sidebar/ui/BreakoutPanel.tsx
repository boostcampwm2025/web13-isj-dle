import { DoorOpen, Minus, Plus, Shuffle, Users } from "lucide-react";

import { useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { BreakoutEventType } from "@shared/types";

export const BreakoutPanel = () => {
  const { socket } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);

  const [roomCount, setRoomCount] = useState(1);
  const [isRandom, setIsRandom] = useState(true);

  const currentRoomUsers = users.filter((u) => u.avatar.currentRoomId === user?.avatar.currentRoomId);

  const handleCreateBreakout = () => {
    if (!socket || !user) return;

    socket.emit(BreakoutEventType.BREAKOUT_CREATE, {
      roomId: user.avatar.currentRoomId,
      config: {
        roomCount,
        isRandom,
      },
      userIds: currentRoomUsers.map((u) => u.id),
    });
  };

  const canCreate = currentRoomUsers.length >= 2 && roomCount >= 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>현재 인원</span>
        </div>
        <span className="font-medium text-gray-700">{currentRoomUsers.length}명</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          <DoorOpen className="h-3.5 w-3.5" />방 개수
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRoomCount(Math.max(2, roomCount - 1))}
            disabled={roomCount <= 2}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex h-9 flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white">
            <span className="text-lg font-semibold text-gray-700">{roomCount}</span>
          </div>
          <button
            onClick={() => setRoomCount(Math.min(10, currentRoomUsers.length, roomCount + 1))}
            disabled={roomCount >= Math.min(10, currentRoomUsers.length)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsRandom(!isRandom)}
        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isRandom ? "bg-gray-700 text-white" : "bg-gray-300 text-gray-600"
            }`}
          >
            <Shuffle className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-semibold text-gray-900">랜덤 배정</span>
            <span className="text-xs text-gray-500">{isRandom ? "참가자를 무작위로 배정" : "수동으로 배정"}</span>
          </div>
        </div>
        <div
          className={`h-6 w-11 rounded-full transition-colors ${isRandom ? "bg-gray-700" : "bg-gray-300"}`}
          style={{ position: "relative" }}
        >
          <div
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
            style={{
              left: isRandom ? "calc(100% - 22px)" : "2px",
            }}
          />
        </div>
      </button>

      <button
        onClick={handleCreateBreakout}
        disabled={!canCreate}
        className="group flex items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-500 px-4 py-3 text-white shadow-sm transition-all hover:border-blue-300 hover:bg-blue-600 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-300 disabled:shadow-none"
      >
        <DoorOpen className="h-5 w-5" />
        <span className="font-semibold">소회의실 생성</span>
      </button>
    </div>
  );
};
