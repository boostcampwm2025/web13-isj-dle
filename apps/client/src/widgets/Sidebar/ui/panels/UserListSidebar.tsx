import { useUser } from "../../../../entities/user";

import { useState } from "react";

import type { User } from "@shared/types";

const UserListSidebar = () => {
  const { user, users } = useUser();
  const sameContactUsers = users.filter((u) => u.contactId === user?.contactId);
  const usersByRoom: Record<string, User[]> = {};
  users
    .filter((u) => u.contactId !== user?.contactId)
    .forEach((user) => {
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
        <UserGroup users={sameContactUsers} title="근처 사람" />
        {user && <UserGroup users={usersByRoom[user!.avatar.currentRoomId]} title={`${user?.avatar.currentRoomId}`} />}
        {Object.entries(usersByRoom)
          .filter(([roomId]) => roomId !== user?.avatar.currentRoomId)
          .map(([roomId, users]) => (
            <UserGroup key={roomId} users={users} title={`${roomId}`} />
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

interface UserGroupProps {
  users: User[];
  title: string;
}

const UserGroup = ({ users, title }: UserGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);

  if (users.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 cursor-pointer text-sm font-semibold text-gray-500" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "▼" : "▶"} {title}
      </div>
      {isOpen && (
        <div className="flex flex-col gap-1">
          {users.map((user, index) => (
            <div
              key={index}
              className={`flex flex-row justify-between ${index !== users.length - 1 ? "border-b" : ""} border-gray-200 p-2`}
            >
              <div className="font-semibold">{user.nickname}</div>
              <div>
                {user.cameraOn ? "📷" : "🚫"} {user.micOn ? "🎤" : "🚫"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserListSidebar;
