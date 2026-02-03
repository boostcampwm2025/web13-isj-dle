import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";

const SCROLL_THRESHOLD = 50;

interface UseChatScrollOptions {
  chatLength: number;
}

interface UseChatScrollReturn {
  ulRef: React.RefObject<HTMLUListElement | null>;
  newChatCount: number;
  scrollToBottom: () => void;
  showNewMessageButton: boolean;
}

export const useChatScroll = ({ chatLength }: UseChatScrollOptions): UseChatScrollReturn => {
  const ulRef = useRef<HTMLUListElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newChatCount, setNewChatCount] = useState(0);
  const prevChatLengthRef = useRef(0);

  const checkIsNearBottom = useCallback(() => {
    if (!ulRef.current) return true;
    const { scrollHeight, scrollTop, clientHeight } = ulRef.current;
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = checkIsNearBottom();
    setIsNearBottom(nearBottom);

    if (nearBottom) {
      setNewChatCount(0);
    }
  }, [checkIsNearBottom]);

  const scrollToBottom = useCallback(() => {
    if (ulRef.current) {
      ulRef.current.scrollTo({ top: ulRef.current.scrollHeight, behavior: "smooth" });
      setNewChatCount(0);
    }
  }, []);

  useEffect(() => {
    const ul = ulRef.current;
    if (!ul) return;

    ul.addEventListener("scroll", handleScroll);
    return () => ul.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const addedCount = chatLength - prevChatLengthRef.current;

    if (addedCount) {
      if (isNearBottom) {
        ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
      } else {
        setNewChatCount((prev) => prev + addedCount);
      }
    }

    prevChatLengthRef.current = chatLength;
  }, [chatLength, isNearBottom]);

  return {
    ulRef,
    newChatCount,
    scrollToBottom,
    showNewMessageButton: !isNearBottom && newChatCount > 0,
  };
};
