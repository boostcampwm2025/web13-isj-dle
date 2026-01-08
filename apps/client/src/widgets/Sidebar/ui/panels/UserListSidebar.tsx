import { useUser } from "../../../../entities/user";
import { UserGroup } from "../../../../shared/ui";

import type { User } from "@shared/types";

const UserListSidebar = () => {
  const { user, users } = useUser();
  const sameContactUsers = users.filter((u) => u.contactId === user?.contactId);
  const usersByRoom: Record<string, User[]> = {};
  users.forEach((user) => {
    if (!usersByRoom[user.avatar.currentRoomId]) {
      usersByRoom[user.avatar.currentRoomId] = [];
    }
    usersByRoom[user.avatar.currentRoomId].push(user);
  });

  const handleInviteClick = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);

    // 추후 toast 라이브러리 사용 고려
    alert("초대 링크가 복사되었습니다\n" + url);
  };

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex grow flex-col gap-1 overflow-y-auto">
        {sameContactUsers.length > 1 && <UserGroup users={sameContactUsers} title="근처 사용자" userId={user!.id} />}
        {user && (
          <UserGroup
            users={usersByRoom[user!.avatar.currentRoomId]}
            title={`${user?.avatar.currentRoomId}`}
            userId={user!.id}
          />
        )}
        {Object.entries(usersByRoom)
          .filter(([roomId]) => roomId !== user?.avatar.currentRoomId)
          .map(([roomId, users]) => (
            <UserGroup key={roomId} users={users} title={`${roomId}`} userId={user!.id} />
          ))}
      </div>
      <div className="flex h-auto flex-row justify-between p-2">
        <div>👥 {users.length}</div>
        <div className="cursor-pointer rounded-md bg-gray-200 px-2 py-1 hover:bg-gray-300" onClick={handleInviteClick}>
          사용자 초대
        </div>
      </div>
    </div>
  );
};

export default UserListSidebar;
