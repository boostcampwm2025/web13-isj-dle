import { formatTime, truncateNickname } from "../lib/format.utils";
import { calculateStopwatchElapsedSeconds, calculateTimerRemainingSeconds, secondsToHms } from "../lib/timer.utils";
import { TIMER_ICON_SIZE } from "../model/timer.constants";
import { Users } from "lucide-react";

import { useStopwatchShareStore } from "@entities/stopwatch-share";
import { useUserStore } from "@entities/user";
import type { UserStopwatchState } from "@shared/types";

const TimerDisplay = ({ user }: { user: UserStopwatchState }) => {
  const { timer } = user;

  const hasStarted = timer.initialTimeSec > 0 || timer.pausedTimeSec > 0;
  if (!hasStarted) {
    return <span className="font-mono text-xs text-gray-400">--:--:--</span>;
  }

  const remaining = calculateTimerRemainingSeconds(timer.startedAt, timer.initialTimeSec, timer.pausedTimeSec);

  const { hours, minutes, seconds } = secondsToHms(remaining);

  return (
    <span className={`font-mono text-xs ${timer.isRunning ? "text-orange-500" : "text-gray-500"}`}>
      {formatTime(hours, minutes, seconds)}
    </span>
  );
};

const StopwatchDisplay = ({ user }: { user: UserStopwatchState }) => {
  const { stopwatch } = user;

  const hasStarted = stopwatch.startedAt !== null || stopwatch.pausedTimeSec > 0;
  if (!hasStarted) {
    return <span className="font-mono text-xs text-gray-400">--:--:--</span>;
  }

  const elapsed = calculateStopwatchElapsedSeconds(stopwatch.startedAt, stopwatch.pausedTimeSec);

  const { hours, minutes, seconds } = secondsToHms(elapsed);

  return (
    <span className={`font-mono text-xs ${stopwatch.isRunning ? "text-green-600" : "text-gray-500"}`}>
      {formatTime(hours, minutes, seconds)}
    </span>
  );
};

export const UserStopwatchList = () => {
  const userStopwatches = useStopwatchShareStore((state) => state.userStopwatches);
  const userId = useUserStore((state) => state.user?.id);

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
    if (a.userId === userId) return -1;
    if (b.userId === userId) return 1;
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
          const isMe = user.userId === userId;
          const displayName = truncateNickname(user.nickname);

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
