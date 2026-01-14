import { useToggle } from "@shared/model/use-toggle";
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
              className={`flex flex-row justify-between ${index !== users.length - 1 ? "border-b" : ""} border-gray-200 p-2`}
              style={{
                backgroundColor: userId === user.id ? "#e0f7fa" : "transparent",
              }}
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

export default UserGroup;
