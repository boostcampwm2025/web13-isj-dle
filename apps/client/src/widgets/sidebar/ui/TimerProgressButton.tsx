import { useEffect, useState } from "react";

import {
  calculateTimerProgressRatio,
  calculateTimerRemainingSeconds,
  useTimerStopwatchStore,
} from "@features/timer-stopwatch-sidebar";
import { ICON_SIZE } from "@shared/config";
import type { SidebarItem } from "@shared/config";

interface TimerProgressButtonProps {
  sidebarItem: SidebarItem;
  isActive: boolean;
  isNewlyAdded?: boolean;
  onClick: () => void;
}

const SIZE = 48;
const STROKE_WIDTH = 3;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const TimerProgressButton = ({ sidebarItem, isActive, isNewlyAdded, onClick }: TimerProgressButtonProps) => {
  const { timer } = useTimerStopwatchStore();
  const { initialTimeSec, isRunning, startedAt } = timer;

  const [timeSec, setTimeSec] = useState(() => calculateTimerRemainingSeconds(startedAt, initialTimeSec, 0));

  useEffect(() => {
    const updateTime = () => {
      const { startedAt, initialTimeSec } = useTimerStopwatchStore.getState().timer;
      setTimeSec(calculateTimerRemainingSeconds(startedAt, initialTimeSec, 0));
    };

    updateTime();

    if (!isRunning) return;

    const intervalId = globalThis.setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning]);

  const showProgress = isRunning && initialTimeSec > 0;

  const progress = showProgress ? calculateTimerProgressRatio(timeSec, initialTimeSec) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const IconComponent = sidebarItem.Icon;

  return (
    <button
      onClick={onClick}
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
        isActive ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
      } ${isNewlyAdded ? "animate-sidebar-tab-enter" : ""}`}
    >
      {showProgress && (
        <svg className="pointer-events-none absolute inset-0 -rotate-90" width={SIZE} height={SIZE}>
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth={STROKE_WIDTH} />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
      )}

      <IconComponent className="h-6 w-6" size={ICON_SIZE} />
    </button>
  );
};
