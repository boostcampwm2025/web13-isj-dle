import { useCallback } from "react";

const MAXIMUM_NUMBER_OF_VISUAL_MEMBERS = 4;

export const useResponsiveVisibility = () => {
  const getResponsiveClass = useCallback((index: number) => {
    if (index === 0) return "";
    if (index === 1) return "hidden sm:block";
    if (index === 2) return "hidden md:block";
    if (index === 3) return "hidden lg:block";
    return "hidden lg:block";
  }, []);

  return {
    getResponsiveClass,
    MAXIMUM_NUMBER_OF_VISUAL_MEMBERS,
  };
};
