import { useMemo } from "react";

import { useUserStore } from "@entities/user";
import { useGroupedUsers } from "@entities/user";
import { useInviteLink } from "@shared/lib/invite";

import UserGroup from "./UserGroup";
import { Users } from "lucide-react";

const UserListSidebar = () => {
  const socketId = useUserStore((state) => state.user?.socketId);
  const userContactId = useUserStore((state) => state.user?.contactId);
  const userCurrentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const users = useUserStore((state) => state.users);

  const user = useMemo(() => {
    if (!socketId || !userCurrentRoomId) return null;
    return {
      socketId: socketId,
      contactId: userContactId,
      avatar: { currentRoomId: userCurrentRoomId },
    };
  }, [socketId, userContactId, userCurrentRoomId]);

  const { sameContactUsers, usersByRoom } = useGroupedUsers(user, users);
  const { handleInviteClick } = useInviteLink();

  if (!user) {
    return <div>사용자 정보 로딩 중...</div>;
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex grow flex-col gap-1 overflow-y-auto">
        {sameContactUsers.length > 1 && (
          <UserGroup users={sameContactUsers} title="근처 사용자" socketId={user.socketId} />
        )}
        {user && (
          <UserGroup
            users={usersByRoom[user.avatar.currentRoomId]}
            title={`${user.avatar.currentRoomId}`}
            socketId={user.socketId}
            updatable={true}
          />
        )}
        {Object.entries(usersByRoom)
          .filter(([roomId]) => roomId !== user.avatar.currentRoomId)
          .map(([roomId, users]) => (
            <UserGroup key={roomId} users={users} title={`${roomId}`} socketId={user.socketId} />
          ))}
      </div>
      <div className="flex h-auto flex-row justify-between p-2">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {users.length}
        </div>
        <div className="cursor-pointer rounded-md bg-gray-200 px-2 py-1 hover:bg-gray-300" onClick={handleInviteClick}>
          사용자 초대
        </div>
      </div>
    </div>
  );
};

export default UserListSidebar;
