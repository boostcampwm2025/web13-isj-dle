import { Mic, MicOff } from "lucide-react";
import { Video, VideoOff } from "lucide-react";

import { ICON_SIZE } from "@shared/config";
import { useToggle } from "@shared/model";
import type { User } from "@shared/types";

interface UserGroupProps {
  users: User[];
  title: string;
  userId: string;
}

const UserGroup = ({ users, title, userId }: UserGroupProps) => {
  const { isOpen, toggle } = useToggle(true);

  if (!users || users.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 cursor-pointer text-sm font-semibold text-gray-500" onClick={toggle}>
        {isOpen ? "▼" : "▶"} {title}
      </div>
      {isOpen && (
        <div className="flex flex-col gap-1">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`flex flex-row items-center justify-between ${index !== users.length - 1 ? "border-b" : ""} border-gray-200 p-2`}
              style={{
                backgroundColor: userId === user.id ? "#e0f7fa" : "transparent",
              }}
            >
              <div className="font-semibold">{user.nickname}</div>
              <div className="flex gap-3">
                {user.micOn ? <Mic color="green" size={ICON_SIZE} /> : <MicOff color="red" size={ICON_SIZE} />}
                {user.cameraOn ? <Video color="green" size={ICON_SIZE} /> : <VideoOff color="red" size={ICON_SIZE} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserGroup;
