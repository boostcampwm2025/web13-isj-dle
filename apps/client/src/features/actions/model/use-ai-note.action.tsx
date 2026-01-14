import type { ActionHook } from "./action.types";
import { Sparkles } from "lucide-react";

export const useAiNoteAction: ActionHook = () => {
  const handleClick = () => {
    // TODO: Implement AI note summarization action
  };

  return {
    title: "AI 요약",
    icon: <Sparkles color="yellow" />,
    handleClick,
  };
};
