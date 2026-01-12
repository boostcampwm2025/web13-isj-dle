import { Sparkles } from "lucide-react";

export const useAiNoteAction = () => {
  const handleClick = () => {
    console.log("AI Note action clicked");
  };

  return {
    title: "AI 요약",
    icon: <Sparkles color="yellow" />,
    handleClick,
  };
};
