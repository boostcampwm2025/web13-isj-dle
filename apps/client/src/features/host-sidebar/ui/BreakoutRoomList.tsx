import { type BreakoutRoom } from "@shared/types";

import { BreakoutRoomCard } from "./BreakoutRoomCard";

interface BreakoutRoomListProps {
  rooms: BreakoutRoom[];
  showJoinButton?: boolean;
  onJoinRoom?: (roomId: string) => void;
  currentRoomId?: string | null;
  isHost?: boolean;
  isRandom?: boolean;
}

const BreakoutRoomList = ({
  rooms,
  showJoinButton = false,
  onJoinRoom,
  currentRoomId,
  isHost = false,
  isRandom = false,
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
          isHost={isHost}
          isRandom={isRandom}
        />
      ))}
    </div>
  );
};

export default BreakoutRoomList;
