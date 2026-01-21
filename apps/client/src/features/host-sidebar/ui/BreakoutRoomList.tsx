import { BreakoutRoomCard } from "./BreakoutRoomCard";

import { type BreakoutRoom } from "@shared/types";

interface BreakoutRoomListProps {
  rooms: BreakoutRoom[];
  showJoinButton?: boolean;
  onJoinRoom?: (roomId: string) => void;
  currentRoomId?: string | null;
}

export const BreakoutRoomList = ({
  rooms,
  showJoinButton = false,
  onJoinRoom,
  currentRoomId,
}: BreakoutRoomListProps) => {
  return (
    <div className="flex flex-col gap-2.5">
      {rooms.map((room, index) => (
        <BreakoutRoomCard
          key={room.roomId}
          room={room}
          index={index}
          showJoinButton={showJoinButton}
          onJoin={() => onJoinRoom?.(room.roomId)}
          isCurrentRoom={room.roomId === currentRoomId}
        />
      ))}
    </div>
  );
};
