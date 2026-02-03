import HoverIconButton from "./HoverIconButton";
import UserModifyPanel from "./UserModifyPanel";
import { Edit, LogOut, Mic, MicOff, Video, VideoOff } from "lucide-react";

import { useState } from "react";
import toast from "react-hot-toast";

import { authApi, useAuthStore } from "@entities/auth";
import { useWebSocket } from "@features/socket";
import { ICON_SIZE } from "@shared/config";
import { useToggle } from "@shared/model";
import type { User } from "@shared/types";

interface UserGroupProps {
  users: User[];
  title: string;
  userId: string;
  updatable?: boolean;
}

const UserGroup = ({ users, title, userId, updatable = false }: UserGroupProps) => {
  const { isOpen, toggle } = useToggle(true);
  const { socket } = useWebSocket();
  const authUser = useAuthStore((s) => s.authUser);
  const setAuthUser = useAuthStore((s) => s.setAuthUser);

  const [openModifyPanel, setOpenModifyPanel] = useState<boolean>(false);

  if (!users || users.length === 0) return null;

  const handleRowClick = () => {
    if (!updatable) return;
    setOpenModifyPanel((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      const response = await authApi.logout();
      if (!response.ok) throw new Error("Failed to logout");

      const data = await response.json();
      if (!data.success) throw new Error("Logout unsuccessful");
      setAuthUser(null);
      socket?.disconnect();
    } catch (error) {
      console.error("Failed to logout:", error);
      toast(`로그아웃에 실패했어요. 다시 시도해 주세요.\n${error}`, { position: "top-right" });
    }
  };

  return (
    <div className="mb-4">
      <div className="mb-2 cursor-pointer text-sm font-semibold text-gray-500" onClick={toggle}>
        {isOpen ? "▼" : "▶"} {title}
      </div>

      {isOpen && (
        <div className="flex flex-col gap-1">
          {users.map((user, index) => {
            const isMe = user.id === userId;

            return (
              <div key={user.id}>
                <div
                  className={`flex flex-row items-center justify-between ${
                    index !== users.length - 1 ? "border-b" : ""
                  } border-gray-200 p-2`}
                  style={{
                    backgroundColor: isMe ? "#e0f7fa" : "transparent",
                  }}
                >
                  <div className="truncate font-semibold">{user.nickname}</div>

                  <div className="ml-2 flex gap-2">
                    {isMe && updatable && (
                      <HoverIconButton title="수정" Icon={Edit} color="blue" onClick={handleRowClick} />
                    )}
                    {isMe && updatable && (
                      <HoverIconButton title="로그아웃" Icon={LogOut} color="blue" onClick={handleLogout} />
                    )}
                    {user.micOn ? <Mic color="green" size={ICON_SIZE} /> : <MicOff color="red" size={ICON_SIZE} />}
                    {user.cameraOn ? (
                      <Video color="green" size={ICON_SIZE} />
                    ) : (
                      <VideoOff color="red" size={ICON_SIZE} />
                    )}
                  </div>
                </div>

                {isMe && updatable && openModifyPanel && (
                  <div className="border border-gray-200 bg-gray-50 p-2">
                    <UserModifyPanel
                      user={user}
                      userId={authUser?.id || 0}
                      onClose={() => setOpenModifyPanel(false)}
                      setAuthUser={setAuthUser}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserGroup;
