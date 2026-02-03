import { calculateTimerRemainingSeconds, hmsToSeconds, secondsToHms } from "../lib/timer.utils";
import { useTimerStopwatchStore } from "../model/timer-stopwatch.store";
import {
  MAX_HOURS,
  MAX_MINUTES,
  MAX_SECONDS,
  MODES,
  MODE_LABELS,
  type Mode,
  QUICK_TIMES,
  TIMER_BUTTON_LABELS,
  TIMER_BUTTON_STYLES,
  TIMER_ICON_SIZE,
  WARNING_SECONDS,
} from "../model/timer.constants";
import { useStopwatch } from "../model/use-stopwatch";
import { useSyncStopwatch } from "../model/use-sync-stopwatch";
import { useTimerActions } from "../model/use-sync-timer";
import { useTimeActions } from "../model/use-time-actions";
import { useTimer } from "../model/use-timer";
import { TimeInput } from "./TimeInput";
import { TimerQuickButton } from "./TimerQuickButton";
import { UserStopwatchList } from "./UserStopwatchList";
import { Pause, Play, RotateCcw } from "lucide-react";

import { useUserStore } from "@entities/user";

export const TimerStopwatchSidebar = () => {
  const { mode, setMode } = useTimerStopwatchStore();
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId ?? null);
  const isMeetingRoom = currentRoomId?.startsWith("meeting") ?? false;
  const isMogakcoRoom = currentRoomId === "mogakco";

  const timer = useTimer(WARNING_SECONDS);
  const stopwatch = useStopwatch();
  const { syncStart, syncPause, syncReset, syncAddTime, syncSetTime } = useTimerActions({
    roomId: currentRoomId,
    isMeetingRoom,
  });
  const { syncTimeState } = useTimeActions({ roomId: currentRoomId, isMogakcoRoom });
  useSyncStopwatch({ roomId: currentRoomId, isMogakcoRoom });

  const isTimerMode = mode === "timer";
  const activeControl = isTimerMode ? timer : stopwatch;

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const syncCurrentState = () => {
    if (!isMogakcoRoom) return;

    const { timer: timerState, stopwatch: stopwatchState } = useTimerStopwatchStore.getState();

    syncTimeState(
      {
        isRunning: stopwatchState.isRunning,
        startedAt: stopwatchState.startedAt,
        pausedTimeSec: stopwatchState.pausedTimeSec,
      },
      {
        isRunning: timerState.isRunning,
        initialTimeSec: timerState.initialTimeSec,
        startedAt: timerState.startedAt,
        pausedTimeSec: timerState.pausedTimeSec,
      },
    );
  };

  const handleStart = () => {
    if (isTimerMode) {
      const { startedAt, pausedTimeSec } = useTimerStopwatchStore.getState().timer;
      const { hours, minutes, seconds } = timer;

      if (startedAt === null && pausedTimeSec === 0) {
        const total = hmsToSeconds(hours, minutes, seconds);
        if (total <= 0) return;
        const now = Date.now();
        timer.start();
        if (isMeetingRoom) {
          syncStart(total, now);
        }
      } else {
        const now = Date.now();
        timer.start();
        if (isMeetingRoom) {
          syncStart(pausedTimeSec, now);
        }
      }
    } else {
      stopwatch.start();
    }
    syncCurrentState();
  };

  const handlePause = () => {
    if (isTimerMode) {
      const { startedAt, initialTimeSec } = useTimerStopwatchStore.getState().timer;
      const remaining = calculateTimerRemainingSeconds(startedAt, initialTimeSec, 0);
      timer.pause();
      if (isMeetingRoom) {
        syncPause(remaining);
      }
    } else {
      stopwatch.pause();
    }

    syncCurrentState();
  };

  const handleReset = () => {
    if (isTimerMode) {
      timer.reset();
      if (isMeetingRoom) {
        syncReset();
      }
    } else {
      stopwatch.reset();
    }

    syncCurrentState();
  };

  const handleAddTime = (sec: number) => {
    timer.addTime(sec);
    if (isMeetingRoom) {
      syncAddTime(sec);
    }

    syncCurrentState();
  };

  const handleTimeCommit = () => {
    if (!isTimerMode || timer.isRunning) return;

    const { hours, minutes, seconds } = timer;
    const totalSec = hmsToSeconds(hours, minutes, seconds);

    if (isMeetingRoom) {
      syncSetTime(totalSec);
    }
    syncCurrentState();
  };

  const isEditable = isTimerMode && !timer.isRunning;

  const displayValues = isTimerMode ? secondsToHms(timer.timeSec) : secondsToHms(stopwatch.timeSec);

  const startStopButtonStyle = activeControl.isRunning ? TIMER_BUTTON_STYLES.running : TIMER_BUTTON_STYLES.stopped;

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-2xl">
          <ModeToggle mode={mode} onModeChange={handleModeChange} />

          {isMeetingRoom && <SharedIndicator message="해당 회의실 참여자와 타이머/스톱워치 상태가 동기화됩니다" />}
          {isMogakcoRoom && (
            <SharedIndicator message="나의 타이머/스톱워치 상태가 참여자들에게 공유되고, 다른 참여자들의 상태도 확인할 수 있어요" />
          )}

          <div className="mb-5 flex items-center justify-center gap-1">
            <TimeInput
              value={displayValues.hours}
              onChange={timer.setHours}
              onCommit={handleTimeCommit}
              max={MAX_HOURS}
              editable={isEditable}
              isWarning={isTimerMode && timer.isWarning}
            />
            <span
              className={`text-3xl font-semibold ${isTimerMode && timer.isWarning ? "text-red-500" : "text-gray-900"}`}
            >
              :
            </span>
            <TimeInput
              value={displayValues.minutes}
              onChange={timer.setMinutes}
              onCommit={handleTimeCommit}
              max={MAX_MINUTES}
              allowOverflow
              overflowBase={60}
              editable={isEditable}
              isWarning={isTimerMode && timer.isWarning}
            />
            <span
              className={`text-3xl font-semibold ${isTimerMode && timer.isWarning ? "text-red-500" : "text-gray-900"}`}
            >
              :
            </span>
            <TimeInput
              value={displayValues.seconds}
              onChange={timer.setSeconds}
              onCommit={handleTimeCommit}
              max={MAX_SECONDS}
              allowOverflow
              overflowBase={60}
              editable={isEditable}
              isWarning={isTimerMode && timer.isWarning}
            />
          </div>
          {isTimerMode && (
            <div className="mb-4 flex justify-center gap-2">
              {QUICK_TIMES.map((quickTime) => (
                <TimerQuickButton
                  key={quickTime.label}
                  label={quickTime.label}
                  onClick={() => handleAddTime(quickTime.seconds)}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={activeControl.isRunning ? handlePause : handleStart}
              className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-lg text-sm font-medium text-white ${startStopButtonStyle}`}
            >
              {activeControl.isRunning ? <Pause size={TIMER_ICON_SIZE} /> : <Play size={TIMER_ICON_SIZE} />}
              {activeControl.isRunning ? TIMER_BUTTON_LABELS.running : TIMER_BUTTON_LABELS.stopped}
            </button>

            <button
              onClick={handleReset}
              className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
            >
              <RotateCcw size={TIMER_ICON_SIZE} />
              초기화
            </button>
          </div>

          {isMogakcoRoom && <UserStopwatchList />}
        </div>
      </div>
    </div>
  );
};

interface ModeToggleProps {
  readonly mode: Mode;
  readonly onModeChange: (mode: Mode) => void;
}

const ModeToggle = ({ mode, onModeChange }: Readonly<ModeToggleProps>) => {
  return (
    <div className="mb-4 rounded-full bg-gray-100 p-1">
      <div className="relative flex">
        <div
          className={`absolute top-0 h-full w-1/2 rounded-full bg-white shadow transition-transform duration-200 ${
            mode === "stopwatch" ? "translate-x-full" : ""
          }`}
        />
        {MODES.map((modeItem) => (
          <button
            key={modeItem}
            onClick={() => onModeChange(modeItem)}
            className="relative z-10 flex-1 py-1.5 text-sm text-gray-700"
          >
            {MODE_LABELS[modeItem]}
          </button>
        ))}
      </div>
    </div>
  );
};

interface SharedIndicatorProps {
  readonly message: string;
}

const SharedIndicator = ({ message }: SharedIndicatorProps) => {
  return (
    <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
      <span>{message}</span>
    </div>
  );
};

export default TimerStopwatchSidebar;
