import { MAX_ROOM_COUNT, MIN_ROOM_COUNT } from "../model/breakout.constants";
import { useBreakout } from "../model/use-breakout";
import { Blocks, Minus, Plus, Shuffle, Users, X } from "lucide-react";

import { useState } from "react";

import { BreakoutRoomList } from "@features/host-sidebar/ui/BreakoutRoomList.tsx";

export const BreakoutPanel = () => {
  const { breakoutState, isBreakoutActive, currentRoomUsers, createBreakout, endBreakout } = useBreakout();

  const [roomCount, setRoomCount] = useState(2);
  const [isRandom, setIsRandom] = useState(true);

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

  const handleToggleRandom = () => {
    setIsRandom((prev) => {
      const nextIsRandom = !prev;

      if (nextIsRandom) {
        const nextMax = Math.min(MAX_ROOM_COUNT, currentRoomUsers.length);
        setRoomCount((prevRoomCount) => Math.max(MIN_ROOM_COUNT, Math.min(nextMax, prevRoomCount)));
      }

      return nextIsRandom;
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
                <Blocks className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-blue-900">책상 나누기 진행 중</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <BreakoutRoomList rooms={breakoutState.rooms} showJoinButton={false} />
        </div>

        <button
          onClick={endBreakout}
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
          <Blocks className="h-3.5 w-3.5" />
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
        onClick={handleToggleRandom}
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
        onClick={() => createBreakout(roomCount, isRandom)}
        disabled={!canCreate}
        className="group flex items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-500 px-4 py-3 text-white shadow-sm transition-all hover:border-blue-300 hover:bg-blue-600 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-300 disabled:shadow-none"
      >
        <Blocks className="h-5 w-5" />
        <span className="font-semibold">책상 나누기</span>
      </button>
    </div>
  );
};
