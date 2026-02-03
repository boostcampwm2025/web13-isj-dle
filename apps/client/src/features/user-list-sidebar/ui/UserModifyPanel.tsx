import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { authApi } from "@entities/auth";
import { AVATAR_ASSETS, type AuthUser, type AvatarAssetKey, type User } from "@shared/types";

interface UserModifyPanelProps {
  user: User;
  onClose: () => void;
  setAuthUser: (user: AuthUser | null) => void;
}

const UserModifyPanel = ({ user, onClose, setAuthUser }: UserModifyPanelProps) => {
  const [nickname, setNickname] = useState(user.nickname);
  const [assetKey, setAssetKey] = useState(user.avatar.assetKey);
  const [saving, setSaving] = useState(false);

  const AVATAR_KEYS = useMemo(() => Object.keys(AVATAR_ASSETS) as AvatarAssetKey[], []);

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const response = await authApi.updateAuthUser({ nickname, avatarAssetKey: assetKey });
      if (!response.ok) throw new Error("Failed to update user");

      const data = await response.json();
      if (!data.user) throw new Error("No user data" + JSON.stringify(data));

      setAuthUser(data.user);
      onClose();
    } catch (error) {
      console.error(error);
      toast(`프로필 수정에 실패했어요. 다시 시도해 주세요.\n${error}`, { position: "top-right" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">프로필 수정</div>
          <div className="text-xs text-gray-500">닉네임과 아바타를 변경할 수 있어요</div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">닉네임</label>
        <input
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="닉네임"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">아바타</span>
          <span className="text-[11px] text-gray-500">선택: {assetKey}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {AVATAR_KEYS.map((key) => {
            const selected = key === assetKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAssetKey(key)}
                className={[
                  "rounded-xl border px-2 py-2 text-xs transition",
                  "hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
                  selected
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex items-center gap-2 pt-1">
        <button
          className="flex-1 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-[0.99]"
          onClick={onClose}
          disabled={saving}
        >
          취소
        </button>
        <button
          className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
};

export default UserModifyPanel;
