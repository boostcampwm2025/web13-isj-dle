import { calculateStopwatchElapsedSeconds, calculateTimerRemainingSeconds, secondsToHms } from "../lib/timer.utils";
import { TIMER_ICON_SIZE } from "../model";
import { Users } from "lucide-react";

import { useEffect, useState } from "react";

import { useStopwatchShareStore } from "@entities/stopwatch-share";
import { useUserStore } from "@entities/user";
import type { UserStopwatchState } from "@shared/types";

const formatTime = (hours: number, minutes: number, seconds: number): string => {
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(seconds).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const truncateNickname = (nickname: string, maxLength: number = 7): string => {
  if (nickname.length <= maxLength) return nickname;
  return `${nickname.slice(0, maxLength)}...`;
};

const TimerDisplay = ({ user }: { user: UserStopwatchState }) => {
  const [displayTime, setDisplayTime] = useState("--:--:--");
  const { timer } = user;

  useEffect(() => {
    const updateTime = () => {
      const remaining = calculateTimerRemainingSeconds(timer.startedAt, timer.initialTimeSec, timer.pausedTimeSec);
      const { hours, minutes, seconds } = secondsToHms(remaining);
      setDisplayTime(formatTime(hours, minutes, seconds));
    };

    updateTime();

    if (timer.isRunning) {
      const intervalId = setInterval(updateTime, 1000);
      return () => clearInterval(intervalId);
    }
  }, [timer.isRunning, timer.startedAt, timer.initialTimeSec, timer.pausedTimeSec]);

  const hasStarted = timer.initialTimeSec > 0 || timer.pausedTimeSec > 0;

  if (!hasStarted) {
    return <span className="font-mono text-xs text-gray-400">--:--:--</span>;
  }

  return (
    <span className={`font-mono text-xs ${timer.isRunning ? "text-orange-500" : "text-gray-500"}`}>{displayTime}</span>
  );
};

const StopwatchDisplay = ({ user }: { user: UserStopwatchState }) => {
  const [displayTime, setDisplayTime] = useState("--:--:--");
  const { stopwatch } = user;

  useEffect(() => {
    const updateTime = () => {
      const elapsed = calculateStopwatchElapsedSeconds(stopwatch.startedAt, stopwatch.pausedTimeSec);
      const { hours, minutes, seconds } = secondsToHms(elapsed);
      setDisplayTime(formatTime(hours, minutes, seconds));
    };

    updateTime();

    if (stopwatch.isRunning) {
      const intervalId = setInterval(updateTime, 1000);
      return () => clearInterval(intervalId);
    }
  }, [stopwatch.isRunning, stopwatch.startedAt, stopwatch.pausedTimeSec]);

  const hasStarted = stopwatch.startedAt !== null || stopwatch.pausedTimeSec > 0;

  if (!hasStarted) {
    return <span className="font-mono text-xs text-gray-400">--:--:--</span>;
  }

  return (
    <span className={`font-mono text-xs ${stopwatch.isRunning ? "text-green-600" : "text-gray-500"}`}>
      {displayTime}
    </span>
  );
};

export const UserStopwatchList = () => {
  const userStopwatches = useStopwatchShareStore((state) => state.userStopwatches);
  const currentUser = useUserStore((state) => state.user);

  if (userStopwatches.length === 0) {
    return (
      <div className="mt-6 rounded-lg">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Users size={TIMER_ICON_SIZE} />
          <span>참여자 현황</span>
        </div>
        <p className="text-center text-sm text-gray-400">참여자가 없습니다.</p>
      </div>
    );
  }

  const sortedUsers = [...userStopwatches].sort((a, b) => {
    if (a.userId === currentUser?.id) return -1;
    if (b.userId === currentUser?.id) return 1;
    return a.nickname.localeCompare(b.nickname);
  });

  return (
    <div className="mt-6 rounded-lg">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
        <Users size={TIMER_ICON_SIZE} />
        <span>참여자 현황</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{userStopwatches.length}</span>
      </div>

      <div className="mb-2 flex items-center justify-between px-1 text-xs text-gray-500">
        <span>닉네임</span>
        <div className="flex gap-3">
          <span className="w-16 text-center text-orange-500">타이머</span>
          <span className="w-16 text-center text-green-600">스톱워치</span>
        </div>
      </div>

      <ul className="space-y-1">
        {sortedUsers.map((user) => {
          const isMe = user.userId === currentUser?.id;
          const displayName = isMe ? `${truncateNickname(user.nickname)}` : truncateNickname(user.nickname);

          return (
            <li
              key={user.userId}
              className={`flex items-center justify-between rounded-md px-1 py-2 ${isMe ? "bg-blue-50" : "bg-white"}`}
            >
              <span className={`text-xs ${isMe ? "font-medium text-blue-700" : "text-gray-700"}`} title={user.nickname}>
                {displayName}
              </span>
              <div className="flex gap-2">
                <div className="w-16 text-center">
                  <TimerDisplay user={user} />
                </div>
                <div className="w-16 text-center">
                  <StopwatchDisplay user={user} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UserStopwatchList;
