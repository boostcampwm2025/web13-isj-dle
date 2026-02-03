import { Blocks } from "lucide-react";

import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import { BreakoutRoomList } from "@features/host-sidebar";
import { useBreakoutJoin } from "@features/host-sidebar";

const ParticipantSidebar = () => {
  const breakoutState = useBreakoutStore((state) => state.breakoutState);
  const userId = useUserStore((state) => state.user?.id);
  const { joinRoom, currentBreakoutRoomId } = useBreakoutJoin();

  if (!breakoutState?.isActive) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-gray-500">
        현재 진행 중인 소회의실이 없습니다.
      </div>
    );
  }

  const isHost = breakoutState.hostId === userId;
  const isRandom = breakoutState.config?.isRandom ?? false;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
            <Blocks className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-blue-900">책상 나누기 진행 중</span>
        </div>
      </div>

      <BreakoutRoomList
        rooms={breakoutState.rooms}
        showJoinButton={true}
        onJoinRoom={joinRoom}
        currentRoomId={currentBreakoutRoomId}
        isHost={isHost}
        isRandom={isRandom}
      />
    </div>
  );
};

export default ParticipantSidebar;
