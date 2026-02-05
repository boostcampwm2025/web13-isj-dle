import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";

import { authApi, useAuthStore } from "@entities/auth";
import { useWebSocket } from "@features/socket";
import type { ActionHook } from "@shared/config";

import { LogOut } from "lucide-react";

export const useLogoutAction: ActionHook = () => {
  const { socket } = useWebSocket();
  const setAuthUser = useAuthStore((s) => s.setAuthUser);

  const handleLogout = useCallback(async () => {
    if (!confirm("정말 로그아웃 하시겠습니까?\n로그아웃하면 로그인 화면으로 이동합니다.")) return;
    try {
      const response = await authApi.logout();
      if (!response.success) throw new Error(`Logout failed: ${response.error}`);

      setAuthUser(null);
      socket?.disconnect();
    } catch (error) {
      console.error("Failed to logout:", error);
      toast(`로그아웃에 실패했어요. 다시 시도해 주세요.\n${error}`, { position: "top-right" });
    }
  }, [setAuthUser, socket]);

  const title = useMemo(() => "로그아웃", []);
  const icon = useMemo(() => <LogOut color="red" />, []);

  return useMemo(
    () => ({
      title,
      icon,
      handleClick: handleLogout,
    }),
    [title, icon, handleLogout],
  );
};
