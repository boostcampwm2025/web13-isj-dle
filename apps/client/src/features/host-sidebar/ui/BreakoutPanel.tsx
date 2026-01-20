import { DoorOpen, Minus, Plus, Shuffle, Users, X } from "lucide-react";

import { useState } from "react";

import { useBreakoutStore } from "@entities/lectern/breakout.store";
import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { LecternEventType } from "@shared/types";

const MAX_ROOM_COUNT = 50;
const MIN_ROOM_COUNT = 2;

export const BreakoutPanel = () => {
  const { socket } = useWebSocket();
  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);
  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const [roomCount, setRoomCount] = useState(2);
  const [isRandom, setIsRandom] = useState(true);

  const isBreakoutActive = breakoutState?.isActive ?? false;

  const currentRoomUsers = users
    .filter((u) => u.avatar.currentRoomId === user?.avatar.currentRoomId)
    .filter((u) => u.id !== user?.id);

  const maxRoomCount = isRandom ? Math.min(MAX_ROOM_COUNT, currentRoomUsers.length) : MAX_ROOM_COUNT;

  const handleRoomCountChange = (value: number) => {
    const clamped = Math.max(MIN_ROOM_COUNT, Math.min(maxRoomCount, value));
    setRoomCount(clamped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      handleRoomCountChange(value);
    }
  };

  const handleCreateBreakout = () => {
    if (!socket || !user) return;

    socket.emit(LecternEventType.BREAKOUT_CREATE, {
      roomId: user.avatar.currentRoomId,
      config: {
        roomCount,
        isRandom,
      },
      userIds: currentRoomUsers.map((u) => u.id),
    });
  };

  const handleEndBreakout = () => {
    if (!socket || !user) return;

    socket.emit(LecternEventType.BREAKOUT_END, {
      roomId: user.avatar.currentRoomId,
    });
  };

  const canCreate = isRandom
    ? currentRoomUsers.length >= MIN_ROOM_COUNT && roomCount >= MIN_ROOM_COUNT
    : roomCount >= MIN_ROOM_COUNT;

  if (isBreakoutActive && breakoutState) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                <DoorOpen className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-blue-900">진행 중인 책상 나누기</span>
                <span className="text-xs text-blue-600">
                  {breakoutState.rooms.length}개 조 · {currentRoomUsers.length}명
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {breakoutState.rooms.map((room, index) => {
            const roomUserCount = room.userIds.length;
            return (
              <div key={room.roomId} className="rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{index + 1}조</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-medium text-gray-700">{roomUserCount}명</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {room.userIds.length > 0 ? (
                    room.userIds.map((userId) => {
                      const roomUser = users.find((u) => u.id === userId);
                      return (
                        <span
                          key={userId}
                          className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700"
                        >
                          {roomUser?.nickname ?? userId.slice(0, 6)}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-gray-400">배정된 인원 없음</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleEndBreakout}
          className="group flex items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-500 px-4 py-3 text-white shadow-sm transition-all hover:border-red-300 hover:bg-red-600 hover:shadow-md active:scale-[0.98]"
        >
          <X className="h-5 w-5" />
          <span className="font-semibold">책상 나누기 종료</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-gray-700">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>현재 인원</span>
        </div>
        <span className="font-medium text-gray-700">{currentRoomUsers.length}명</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-700">
          <DoorOpen className="h-3.5 w-3.5" />
          책상 개수
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRoomCountChange(roomCount - 1)}
            disabled={roomCount <= MIN_ROOM_COUNT}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={roomCount}
            onChange={handleInputChange}
            min={MIN_ROOM_COUNT}
            max={maxRoomCount}
            className="h-9 flex-1 [appearance:textfield] rounded-lg border border-gray-300 bg-white text-center text-lg font-semibold text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            onClick={() => handleRoomCountChange(roomCount + 1)}
            disabled={roomCount >= maxRoomCount}
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
        <span className="font-semibold">책상 나누기</span>
      </button>
    </div>
  );
};
