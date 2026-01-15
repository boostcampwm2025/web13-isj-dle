import { type KeyboardEvent, useRef } from "react";

import type { ReceivedChatMessage } from "@livekit/components-react";

export const useChatTextarea = (send: (message: string) => Promise<ReceivedChatMessage>) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_ROWS = 3;
  const LINE_HEIGHT = 20;

  const sendMessage = async () => {
    if (textareaRef.current && textareaRef.current.value.trim() !== "") {
      await send(textareaRef.current.value);
      textareaRef.current.value = "";
      textareaRef.current.focus();
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

    textareaRef.current.style.height = "auto";
    const maxHeight = LINE_HEIGHT * MAX_ROWS;

    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
    textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  return { textareaRef, handleKeyDown, handleInput, sendMessage };
};
