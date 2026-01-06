import { useUser } from "../../../../entities/user";

const UserListSidebar = () => {
  const { users } = useUser();

  const handleInviteClick = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);

    // 추후 toast 라이브러리 사용 고려
    alert("초대 링크가 복사되었습니다\n" + url);
  };

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex grow flex-col gap-1 overflow-y-auto">
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
