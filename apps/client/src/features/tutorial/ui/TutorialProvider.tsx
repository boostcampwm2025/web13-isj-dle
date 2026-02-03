import { TUTORIAL_AUTO_START_DELAY } from "../model/tutorial.constants";
import { useTutorialStore } from "../model/tutorial.store";
import { useTutorial } from "../model/use-tutorial";
import "../styles/tutorial.css";
import "shepherd.js/dist/css/shepherd.css";

import { useEffect } from "react";

interface TutorialProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
}

export const TutorialProvider = ({ children, autoStart = true }: TutorialProviderProps) => {
  const { startTutorial } = useTutorial();
  const { isCompleted } = useTutorialStore();

  useEffect(() => {
    if (autoStart && !isCompleted) {
      const timer = setTimeout(() => {
        startTutorial();
      }, TUTORIAL_AUTO_START_DELAY);

      return () => clearTimeout(timer);
    }
  }, [autoStart, isCompleted, startTutorial]);

  return <>{children}</>;
};
