import { type Participant, RoomEvent } from "livekit-client";
import { Send } from "lucide-react";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { type ChatEntryProps, type ReceivedChatMessage, useChat, useRoomContext } from "@livekit/components-react";

const ChatEntry = ({ entry, hideName, hideTimestamp }: ChatEntryProps) => {
  const time = new Date(entry.timestamp);
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";

  const name = entry.from?.name ?? entry.from?.identity;

  if (name === "System") {
    return (
      <li className="flex justify-center">
        <span className="text-center text-sm whitespace-pre-wrap text-gray-500">{entry.message}</span>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1" title={time.toLocaleTimeString(locale, { timeStyle: "full" })}>
      {!hideName && <div className="text-base font-bold">{name}</div>}
      <div className="flex flex-row justify-between gap-2 text-sm">
        <span
          className="rounded-md px-2 py-1 break-all whitespace-pre-wrap"
          style={{ backgroundColor: entry.from?.isLocal ? "#d1ffd6" : "#f0f0f0" }}
        >
          {entry.message}
        </span>

        {!hideTimestamp && (
          <span className="whitespace-nowrap">
            {time.toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        )}
      </div>
    </li>
  );
};

const ChatSidebar = () => {
  const ulRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { chatMessages, send, isSending } = useChat();
  const [initialMessage, setInitialMessage] = useState<ReceivedChatMessage[]>([]);
  const room = useRoomContext();
  const [systemMessages, setSystemMessages] = useState<ReceivedChatMessage[]>([]);
  const [chatMessagesCombined, setChatMessagesCombined] = useState<ReceivedChatMessage[]>([]);

  useEffect(() => {
    const init = () => {
      const systemWelcome: ReceivedChatMessage = {
        id: "system-welcome",
        message: `환영합니다! 채팅에 참여해보세요.\n${room.name || "알 수 없는"} 방에 참가했습니다.`,
        timestamp: Date.now(),
        from: {
          name: "System",
          identity: "System",
          isLocal: false,
        } as Participant,
      };

      setInitialMessage([systemWelcome]);
    };

    init();
  }, [room.name]);

  useEffect(() => {
    const onConnected = (p: Participant) => {
      setSystemMessages((prev) => [
        ...prev,
        {
          id: `system-join-${p.sid}`,
          message: `${p.name ?? p.identity}가 방에 입장했습니다.`,
          timestamp: Date.now(),
          from: {
            name: "System",
            identity: "System",
            isLocal: false,
          } as Participant,
        },
      ]);
    };
    const onDisconnected = (p: Participant) => {
      setSystemMessages((prev) => [
        ...prev,
        {
          id: `system-leave-${p.sid}`,
          message: `${p.name ?? p.identity}가 방을 나갔습니다.`,
          timestamp: Date.now(),
          from: {
            name: "System",
            identity: "System",
            isLocal: false,
          } as Participant,
        },
      ]);
    };

    room.on(RoomEvent.ParticipantConnected, onConnected);
    room.on(RoomEvent.ParticipantDisconnected, onDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onConnected);
      room.off(RoomEvent.ParticipantDisconnected, onDisconnected);
    };
  }, [room]);

  useEffect(() => {
    const updateCombinedMessages = () => {
      setChatMessagesCombined(
        [...initialMessage, ...chatMessages, ...systemMessages].sort((a, b) => a.timestamp - b.timestamp),
      );
    };
    updateCombinedMessages();
  }, [initialMessage, chatMessages, systemMessages]);

  useEffect(() => {
    ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
  }, [chatMessagesCombined]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (inputRef.current && inputRef.current.value.trim() !== "") {
      await send(inputRef.current.value);
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  return (
    <div className="grid h-full w-full items-end">
      <ul className="flex h-full w-full flex-col gap-1 overflow-auto" ref={ulRef}>
        {chatMessagesCombined.map((msg, idx, allMsg) => {
          const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from;
          const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000;

          return (
            <ChatEntry
              key={msg.id}
              hideName={hideName}
              hideTimestamp={hideName === false ? false : hideTimestamp}
              entry={msg}
            />
          );
        })}
      </ul>
      <form className="flex gap-2 border-t border-gray-800 pt-2" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-md border border-gray-300 px-2 py-1"
          disabled={isSending}
          ref={inputRef}
          type="text"
          placeholder="메시지 입력..."
          onInput={(ev) => ev.stopPropagation()}
          onKeyDown={(ev) => ev.stopPropagation()}
          onKeyUp={(ev) => ev.stopPropagation()}
        />
        <button
          type="submit"
          className="relative inline-flex cursor-pointer items-center justify-center p-0"
          disabled={isSending}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatSidebar;
