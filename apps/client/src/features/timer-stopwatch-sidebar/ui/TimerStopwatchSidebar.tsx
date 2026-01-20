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
import { useTimer } from "../model/use-timer";
import { TimeInput } from "./TimeInput";
import { TimerQuickButton } from "./TimerQuickButton";
import { Pause, Play, RotateCcw } from "lucide-react";

const getDisplayValues = (timeSec: number) => ({
  hours: Math.floor(timeSec / 3600),
  minutes: Math.floor((timeSec % 3600) / 60),
  seconds: timeSec % 60,
});

export const TimerStopwatchSidebar = () => {
  const { mode, setMode } = useTimerStopwatchStore();

  const timer = useTimer(WARNING_SECONDS);
  const stopwatch = useStopwatch();

  const isTimerMode = mode === "timer";
  const activeControl = isTimerMode ? timer : stopwatch;

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const isEditable = isTimerMode && !timer.isRunning;

  const displayValues = isTimerMode
    ? timer.isRunning || timer.timeSec > 0
      ? getDisplayValues(timer.timeSec)
      : { hours: timer.hours, minutes: timer.minutes, seconds: timer.seconds }
    : getDisplayValues(stopwatch.timeSec);

  const startStopButtonStyle = activeControl.isRunning ? TIMER_BUTTON_STYLES.running : TIMER_BUTTON_STYLES.stopped;

  return (
    <div className="h-full w-full p-3">
      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-2xl">
          <ModeToggle mode={mode} onModeChange={handleModeChange} />

          <div className="mb-5 flex items-center justify-center gap-1">
            <TimeInput
              value={displayValues.hours}
              onChange={timer.setHours}
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
              max={MAX_MINUTES}
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
              max={MAX_SECONDS}
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
                  onClick={() => timer.addTime(quickTime.seconds)}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={activeControl.isRunning ? activeControl.pause : activeControl.start}
              className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-lg text-sm font-medium text-white ${startStopButtonStyle}`}
            >
              {activeControl.isRunning ? <Pause size={TIMER_ICON_SIZE} /> : <Play size={TIMER_ICON_SIZE} />}
              {activeControl.isRunning ? TIMER_BUTTON_LABELS.running : TIMER_BUTTON_LABELS.stopped}
            </button>

            <button
              onClick={activeControl.reset}
              className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
            >
              <RotateCcw size={TIMER_ICON_SIZE} />
              초기화
            </button>
          </div>
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
            className="relative z-10 flex-1 cursor-pointer py-1.5 text-sm text-gray-700"
          >
            {MODE_LABELS[modeItem]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimerStopwatchSidebar;
