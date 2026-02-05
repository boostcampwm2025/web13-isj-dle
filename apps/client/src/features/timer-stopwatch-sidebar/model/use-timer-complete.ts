import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

import { TIMER_COMPLETE_TOAST_ID } from "@shared/config";

import { playChime } from "../lib/use-chime-sound";
import { isTimerCompleted } from "./timer-state";
import { useTimerStopwatchStore } from "./timer-stopwatch.store";

let lastNotifiedRunId: number | null = null;

export const useTimerCompletionNotification = () => {
  const isCompleted = useTimerStopwatchStore((state) => isTimerCompleted(state.timer));
  const startedAt = useTimerStopwatchStore((state) => state.timer.startedAt);

  const runIdRef = useRef<number | null>(startedAt);

  useEffect(() => {
    if (startedAt === null) return;
    runIdRef.current = startedAt;
  }, [startedAt]);

  useEffect(() => {
    if (!isCompleted) return;

    const runId = runIdRef.current;
    if (runId !== null && lastNotifiedRunId === runId) return;
    lastNotifiedRunId = runId;

    playChime();
    toast("타이머 시간이 종료되었습니다.", { id: TIMER_COMPLETE_TOAST_ID });
  }, [isCompleted]);
};
