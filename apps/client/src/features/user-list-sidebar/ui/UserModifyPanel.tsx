import { useState } from "react";

import { authApi } from "@entities/auth";
import { AVATAR_ASSETS, type AuthUser, type AvatarAssetKey, type User } from "@shared/types";

interface UserModifyPanelProps {
  user: User;
  userId: number;
  onClose: () => void;
  setAuthUser: (user: AuthUser | null) => void;
}

const UserModifyPanel = ({ user, userId, onClose, setAuthUser }: UserModifyPanelProps) => {
  const [nickname, setNickname] = useState(user.nickname);
  const [assetKey, setAssetKey] = useState(user.avatar.assetKey);

  const AVATAR_KEYS = Object.keys(AVATAR_ASSETS) as AvatarAssetKey[];

  const onSave = async () => {
    const response = await authApi.updateAuthUser({ userId: userId, nickname, avatarAssetKey: assetKey });
    console.log("User update response:", response);
    setAuthUser(response.user);
    onClose();
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        className="w-full rounded border px-2 py-1 text-sm"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="닉네임"
      />
      <div className="grid grid-cols-2 gap-2">
        {AVATAR_KEYS.map((key) => (
          <div
            key={key}
            className={`rounded-lg p-1 text-center ${key === assetKey ? "cursor-default bg-green-300" : "cursor-pointer bg-gray-300 hover:bg-gray-400"}`}
            onClick={() => setAssetKey(key)}
          >
            {key}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button className="flex-1 rounded bg-blue-600 px-2 py-1 text-sm text-white" onClick={onSave}>
          저장
        </button>
        <button className="flex-1 rounded bg-red-600 px-2 py-1 text-sm text-white" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
};

export default UserModifyPanel;
