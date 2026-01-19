import { useEffect, useMemo, useRef } from "react";

import { useChat } from "@livekit/components-react";
import { useChatStore } from "@src/entities/chat";

export const useChatMessage = () => {
  const ulRef = useRef<HTMLUListElement>(null);
  const chatMessages = useChatStore((s) => s.chatMessages);
  const systemMessages = useChatStore((s) => s.systemMessages);

  const { isSending, send } = useChat();

  const messages = useMemo(() => {
    return [...systemMessages, ...chatMessages].sort((a, b) => a.timestamp - b.timestamp);
  }, [systemMessages, chatMessages]);

  useEffect(() => {
    if (ulRef.current && ulRef.current.scrollHeight - ulRef.current.scrollTop - ulRef.current.clientHeight < 100) {
      ulRef.current.scrollTo({ top: ulRef.current.scrollHeight });
    }
  }, [messages]);

  return { messages, isSending, send, ulRef };
};
