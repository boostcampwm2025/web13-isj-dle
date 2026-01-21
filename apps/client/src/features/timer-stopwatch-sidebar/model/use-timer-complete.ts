import { playChime } from "../lib/use-chime-sound";
import { useTimerStopwatchStore } from "./timer-stopwatch.store";

import { useEffect, useRef } from "react";

import { toast } from "@shared/ui";

export const useTimerComplete = () => {
  const completedAt = useTimerStopwatchStore((state) => state.timer.completedAt);
  const lastCompletedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (completedAt === null) return;
    if (lastCompletedAtRef.current === completedAt) return;

    lastCompletedAtRef.current = completedAt;
    playChime();
    toast("타이머 시간이 종료되었습니다.");
  }, [completedAt]);
};
