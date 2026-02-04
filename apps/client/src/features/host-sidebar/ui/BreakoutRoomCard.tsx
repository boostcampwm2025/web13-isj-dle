import { Users } from "lucide-react";

import { type BreakoutRoom } from "@shared/types";

interface BreakoutRoomCardProps {
  room: BreakoutRoom;
  index: number;
  showJoinButton?: boolean;
  onJoin?: () => void;
  isCurrentRoom?: boolean;
  isHost?: boolean;
  isRandom?: boolean;
}

export const BreakoutRoomCard = ({
  room,
  index,
  showJoinButton = false,
  onJoin,
  isCurrentRoom = false,
  isHost = false,
  isRandom = false,
}: BreakoutRoomCardProps) => {
  const canJoin = isHost || !isRandom;
  return (
    <div
      className={`rounded-lg border px-3.5 py-3 shadow-sm ${
        isCurrentRoom ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-9 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
            {index + 1}
          </div>
          {isCurrentRoom && <span className="text-xs font-medium text-blue-600">현재 위치</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-gray-700">{room.socketIds.length}명</span>
          </div>
          {showJoinButton && !isCurrentRoom && canJoin && (
            <button
              onClick={onJoin}
              className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
            >
              입장
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
