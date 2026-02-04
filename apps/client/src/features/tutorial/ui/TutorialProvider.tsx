import { TUTORIAL_AUTO_START_DELAY } from "../model/tutorial.constants";
import { useTutorialStore } from "../model/tutorial.store";
import { useTutorial } from "../model/use-tutorial";
import "../styles/tutorial.css";
import "shepherd.js/dist/css/shepherd.css";

import { useEffect, useState } from "react";

import { useAuthStore } from "@entities/auth";

interface TutorialProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
}

export const TutorialProvider = ({ children, autoStart = true }: TutorialProviderProps) => {
  const { startTutorial } = useTutorial();
  const { isCompleted, setCompleted } = useTutorialStore();
  const [isLoading, setIsLoading] = useState(true);
  const tutorialCompleted = useAuthStore((s) => s.authUser?.tutorialCompleted);

  useEffect(() => {
    const fetchTutorialStatus = async () => {
      if (tutorialCompleted) {
        setCompleted(true);
      }
      setIsLoading(false);
    };

    fetchTutorialStatus();
  }, [tutorialCompleted, setCompleted]);

  useEffect(() => {
    if (autoStart && !isCompleted && !isLoading) {
      const timer = setTimeout(() => {
        startTutorial();
      }, TUTORIAL_AUTO_START_DELAY);

      return () => clearTimeout(timer);
    }
  }, [autoStart, isCompleted, isLoading, startTutorial]);

  if (isLoading) return null;

  return <>{children}</>;
};
