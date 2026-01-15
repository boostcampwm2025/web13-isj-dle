import { type KeyboardEvent, useEffect, useRef } from "react";

import type { ReceivedChatMessage } from "@livekit/components-react";

export const useChatTextarea = (send: (message: string) => Promise<ReceivedChatMessage>) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_ROWS = 3;
  const LINE_HEIGHT = 20;

  const resetHeight = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.overflowY = "hidden";
  };

  const sendMessage = async () => {
    if (textareaRef.current && textareaRef.current.value.trim() !== "") {
      await send(textareaRef.current.value);
      textareaRef.current.value = "";
      textareaRef.current.focus();
      resetHeight(textareaRef.current);
    }
  };

  const handleKeyDown = async (ev: KeyboardEvent<HTMLTextAreaElement>) => {
    ev.stopPropagation();
    if (ev.nativeEvent.isComposing) return;

    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      await sendMessage();
    }
  };

  const handleInput = () => {
    if (!textareaRef.current) return;

    resetHeight(textareaRef.current);
    const maxHeight = LINE_HEIGHT * MAX_ROWS;

    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
    textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.target === el) return;
      el.blur();
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      el.blur();
    };
  }, []);

  return { textareaRef, handleKeyDown, handleInput, sendMessage };
};
