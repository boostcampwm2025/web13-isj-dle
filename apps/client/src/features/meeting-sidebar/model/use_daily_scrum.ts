import { requestDailyScrumQuestion } from "../api/daily_scrum_question.api";

import { useState } from "react";

import type { DailyScrumQuestion } from "@shared/types";

export const useDailyScrum = () => {
  const [num, setNum] = useState(1);
  const [questions, setQuestions] = useState<DailyScrumQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleQuestions = async (): Promise<void> => {
    setError(null);
    setQuestions([]);
    try {
      const response = await requestDailyScrumQuestion(num);
      setQuestions(response.questions);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const resetQuestions = () => {
    setQuestions([]);
    setError(null);
  };

  return { handleQuestions, num, setNum, questions, error, resetQuestions };
};
