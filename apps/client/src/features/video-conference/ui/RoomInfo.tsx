import { useRoomContext } from "@livekit/components-react";
import { useUser } from "@src/entities/user";

const RoomInfo = () => {
  const { user } = useUser();
  const room = useRoomContext();

  return (
    <div className="pointer-events-auto rounded bg-gray-800 px-4 py-2 text-white">
      <div className="text-sm">현재 방 ID: {user?.avatar.currentRoomId}</div>
      <div className="text-sm">LiveKit Room: {room.name}</div>
      <div className="mt-1 text-xs text-gray-400">
        {user?.avatar.currentRoomId === room.name ? "✓ 동기화됨" : "⚠ 불일치"}
      </div>
    </div>
  );
};

export default RoomInfo;
