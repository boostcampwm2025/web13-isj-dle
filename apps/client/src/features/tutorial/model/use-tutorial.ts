import { TUTORIAL_STEPS } from "./tutorial.constants";
import { useTutorialStore } from "./tutorial.store";
import Shepherd, { type Tour } from "shepherd.js";

import { useCallback, useEffect, useRef } from "react";

export const useTutorial = () => {
  const tourRef = useRef<Tour | null>(null);
  const { isCompleted, isActive, setCompleted, setActive, setCurrentStep } = useTutorialStore();

  const createTour = useCallback(() => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: false },
        classes: "shepherd-theme-custom",
        scrollTo: false,
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 12,
      },
    });

    const isFirstStep = (idx: number) => idx === 0;
    const isLastStep = (idx: number) => idx === TUTORIAL_STEPS.length - 1;

    const getPrimaryButtonText = (idx: number) => {
      if (isFirstStep(idx)) return "시작할게요";
      if (isLastStep(idx)) return "시작하기";
      return "다음";
    };

    TUTORIAL_STEPS.forEach((step, index) => {
      tour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        attachTo: step.attachTo,
        buttons: [
          ...(!isLastStep(index)
            ? [
                {
                  text: "건너뛰기",
                  action: () => {
                    setCompleted(true);
                    tour.cancel();
                  },
                  classes: "shepherd-button-skip",
                },
              ]
            : []),
          ...(index > 0 ? [{ text: "이전", action: tour.back, classes: "shepherd-button-secondary" }] : []),
          {
            text: getPrimaryButtonText(index),
            action: isLastStep(index) ? tour.complete : tour.next,
            classes: "shepherd-button-primary",
          },
        ],
        when: {
          show: () => setCurrentStep(index),
        },
      });
    });

    tour.on("complete", () => {
      setCompleted(true);
      setActive(false);
      document.documentElement.classList.remove("tutorial-active");
    });

    tour.on("cancel", () => {
      setActive(false);
      document.documentElement.classList.remove("tutorial-active");
    });

    return tour;
  }, [setCompleted, setActive, setCurrentStep]);

  const startTutorial = useCallback(() => {
    if (tourRef.current) {
      tourRef.current.cancel();
    }

    tourRef.current = createTour();
    tourRef.current.start();
    setActive(true);
    document.documentElement.classList.add("tutorial-active");
  }, [createTour, setActive]);

  const stopTutorial = useCallback(() => {
    if (tourRef.current) {
      tourRef.current.cancel();
      tourRef.current = null;
    }
    setActive(false);
    document.documentElement.classList.remove("tutorial-active");
  }, [setActive]);

  const resetTutorial = useCallback(() => {
    useTutorialStore.getState().reset();
  }, []);

  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.cancel();
      }
    };
  }, []);

  return {
    isCompleted,
    isActive,
    startTutorial,
    stopTutorial,
    resetTutorial,
  };
};
