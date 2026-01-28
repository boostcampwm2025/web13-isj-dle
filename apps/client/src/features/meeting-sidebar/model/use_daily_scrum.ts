import { useEffect, useState } from "react";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { type DailyScrumQuestion, MeetingEventType, type RandomDailyScrumQuestionsResponse } from "@shared/types";

export const useDailyScrum = () => {
  const [num, setNum] = useState(1);
  const [questions, setQuestions] = useState<DailyScrumQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useWebSocket();
  const roomId = useUserStore((state) => state.user?.avatar.currentRoomId);

  const handleQuestions = async (): Promise<void> => {
    setError(null);
    try {
      if (!socket) throw new Error("Socket is not connected");
      if (!roomId) throw new Error("User is not in a room");
      socket.emit(MeetingEventType.DAILY_SCRUM_QUESTION_UPDATE, { roomId, num });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const resetQuestions = () => {
    setError(null);
    try {
      if (!socket) throw new Error("Socket is not connected");
      if (!roomId) throw new Error("User is not in a room");
      socket.emit(MeetingEventType.DAILY_SCRUM_QUESTION_RESET, { roomId });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    if (!isConnected || !socket) return;

    const handleDailyScrumSync = (data: RandomDailyScrumQuestionsResponse) => {
      setQuestions(data.questions);
    };

    const handleDailyScrumReset = () => {
      setQuestions([]);
      setError(null);
    };

    socket.on(MeetingEventType.DAILY_SCRUM_QUESTION_SYNC, handleDailyScrumSync);
    socket.on(MeetingEventType.DAILY_SCRUM_QUESTION_RESET, handleDailyScrumReset);
    return () => {
      socket.off(MeetingEventType.DAILY_SCRUM_QUESTION_SYNC, handleDailyScrumSync);
      socket.off(MeetingEventType.DAILY_SCRUM_QUESTION_RESET, handleDailyScrumReset);
    };
  }, [isConnected, socket]);

  return { handleQuestions, num, setNum, questions, error, resetQuestions };
};
