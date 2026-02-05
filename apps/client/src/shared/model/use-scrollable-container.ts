import { useCallback, useEffect, useRef, useState } from "react";

export const useScrollableContainer = (itemCount: number) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    setIsScrollable(hasOverflow);
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const timeoutId = setTimeout(() => {
      checkScrollability();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      checkScrollability();
    });

    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(() => {
      checkScrollability();
    });

    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    const handleResize = () => {
      checkScrollability();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
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
    isScrollable,
    checkScrollability,
    scroll,
  };
};
