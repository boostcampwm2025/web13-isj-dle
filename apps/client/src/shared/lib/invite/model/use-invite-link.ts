import { useCallback } from "react";

export const useInviteLink = () => {
  const handleInviteClick = useCallback(async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);

    // TODO: 추후 toast 라이브러리 사용 고려
    alert("초대 링크가 복사되었습니다\n" + url);
  }, []);

  return {
    handleInviteClick,
  };
};
