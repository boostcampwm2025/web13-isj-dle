import { useCallback } from "react";
import { toast } from "react-hot-toast";

export const useInviteLink = () => {
  const handleInviteClick = useCallback(async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);

    toast("초대 링크가 복사되었습니다\n" + url);
  }, []);

  return {
    handleInviteClick,
  };
};
