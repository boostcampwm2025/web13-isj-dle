export const formatTime = (hours: number, minutes: number, seconds: number): string => {
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(seconds).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export const truncateNickname = (nickname: string, maxLength: number = 7): string => {
  if (nickname.length <= maxLength) return nickname;
  return `${nickname.slice(0, maxLength)}...`;
};
