import { useEffect, useMemo, useRef } from "react";

import { JOIN_SUFFIX, LEAVE_SUFFIX, useChatStore } from "@entities/chat";
import { type ReceivedChatMessage, useChat } from "@livekit/components-react";

export const useChatMessage = () => {
  const ulRef = useRef<HTMLUListElement>(null);
  const chatMessages = useChatStore((s) => s.chatMessages);
  const systemMessages = useChatStore((s) => s.systemMessages);

  const { isSending, send } = useChat();

  const messages = useMemo(() => {
    const combined = [...systemMessages, ...chatMessages].sort((a, b) => a.timestamp - b.timestamp);
    const deduped: ReceivedChatMessage[] = [];

    let joinRun = 0;
    let leaveRun = 0;

    const MAX_RUN = 5;

    for (const cur of combined) {
      const isJoin = cur.from?.name === "System" && cur.message.endsWith(JOIN_SUFFIX);
      const isLeave = cur.from?.name === "System" && cur.message.endsWith(LEAVE_SUFFIX);

      if (isJoin) {
        joinRun += 1;
        leaveRun = 0;

        if (joinRun <= MAX_RUN) {
          deduped.push({ ...cur });
          continue;
        }

        const last = deduped[deduped.length - 1];
        const baseName = last.message.split(JOIN_SUFFIX)[0].split("외")[0].trim();
        const extra = joinRun - MAX_RUN;
        last.message = `${baseName} 외 ${extra}명${JOIN_SUFFIX}`;
        continue;
      }

      if (isLeave) {
        leaveRun += 1;
        joinRun = 0;

        if (leaveRun <= MAX_RUN) {
          deduped.push({ ...cur });
          continue;
        }

        const last = deduped[deduped.length - 1];
        const baseName = last.message.split(LEAVE_SUFFIX)[0].split("외")[0].trim();
        const extra = leaveRun - MAX_RUN;
        last.message = `${baseName} 외 ${extra}명${LEAVE_SUFFIX}`;
        continue;
      }

      joinRun = 0;
      leaveRun = 0;
      deduped.push({ ...cur });
    }

    return deduped;
  }, [systemMessages, chatMessages]);

  useEffect(() => {
    if (ulRef.current && ulRef.current.scrollHeight - ulRef.current.scrollTop - ulRef.current.clientHeight < 100) {
      ulRef.current.scrollTo({ top: ulRef.current.scrollHeight });
    }
  }, [messages]);

  return { messages, isSending, send, ulRef };
};
