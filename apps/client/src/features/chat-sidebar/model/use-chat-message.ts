import { useEffect, useMemo, useRef } from "react";

import { JOIN_SUFFIX, LEAVE_SUFFIX, useChatStore } from "@entities/chat";
import { useUserStore } from "@entities/user";
import { type ReceivedChatMessage, useChat } from "@livekit/components-react";

type BoundaryChatMessage = ReceivedChatMessage & {
  contactId: string | null;
};

export const useChatMessage = () => {
  const ulRef = useRef<HTMLUListElement>(null);

  const chatMessages = useChatStore((s) => s.chatMessages);
  const systemMessages = useChatStore((s) => s.systemMessages);

  const currentRoomId = useUserStore((s) => s.user?.avatar.currentRoomId ?? null);
  const myContactId = useUserStore((s) => s.user?.contactId ?? null);

  const { isSending, send } = useChat();

  const parseMessage = (msg: ReceivedChatMessage): BoundaryChatMessage => {
    try {
      const parsed: unknown = JSON.parse(msg.message);

      if (typeof parsed === "object" && parsed !== null && "text" in parsed) {
        const payload = parsed as Record<string, unknown>;

        if (typeof payload.text === "string") {
          return {
            ...msg,
            message: payload.text,
            contactId: typeof payload.contactId === "string" ? payload.contactId : null,
          };
        }
      }
    } catch {
      // json 아님(console 대신 작성)
    }

    return {
      ...msg,
      contactId: null,
    };
  };

  const messages = useMemo(() => {
    if (!currentRoomId) return [];
    const isLobby = currentRoomId === "lobby";
    if (isLobby && !myContactId) return [];

    const combined = [...systemMessages, ...chatMessages]
      .map(parseMessage)
      .filter((msg) => {
        if (msg.from?.name === "System") return true;
        if (!isLobby) return true;
        return msg.contactId === myContactId;
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    const deduped: BoundaryChatMessage[] = [];
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
          deduped.push(cur);
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
          deduped.push(cur);
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
      deduped.push(cur);
    }

    return deduped;
  }, [chatMessages, systemMessages, myContactId, currentRoomId]);

  useEffect(() => {
    if (ulRef.current && ulRef.current.scrollHeight - ulRef.current.scrollTop - ulRef.current.clientHeight < 100) {
      ulRef.current.scrollTo({ top: ulRef.current.scrollHeight });
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const isLobby = currentRoomId === "lobby";
    await send(
      JSON.stringify({
        text,
        contactId: isLobby ? myContactId : null,
      }),
    );
  };

  return {
    messages,
    isSending,
    send: sendMessage,
    ulRef,
  };
};
