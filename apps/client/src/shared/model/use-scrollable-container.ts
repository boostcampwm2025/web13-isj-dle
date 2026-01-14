import { useCallback, useEffect, useRef, useState } from "react";

export const useScrollableContainer = (itemCount: number) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScrollability();
  }, [itemCount, checkScrollability]);

  const scroll = useCallback((direction: "left" | "right", scrollAmount = 136) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    checkScrollability,
    scroll,
  };
};
