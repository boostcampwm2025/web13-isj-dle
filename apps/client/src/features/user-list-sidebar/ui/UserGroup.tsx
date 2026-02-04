import HoverIconButton from "./HoverIconButton";
import UserModifyPanel from "./UserModifyPanel";
import { Edit, Mic, MicOff, Video, VideoOff } from "lucide-react";

import { useState } from "react";

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

  const [openModifyPanel, setOpenModifyPanel] = useState<boolean>(false);

  if (!users || users.length === 0) return null;

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
                      <HoverIconButton
                        title="수정"
                        Icon={Edit}
                        color="blue"
                        onClick={() => setOpenModifyPanel((prev) => !prev)}
                      />
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
                    <UserModifyPanel user={user} onClose={() => setOpenModifyPanel(false)} />
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
