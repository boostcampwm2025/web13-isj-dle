import { useChatMessage } from "../../model/use-chat-message";
import { useChatTextarea } from "../../model/use-chat-textarea";
import { Send } from "lucide-react";

import { type ChatEntryProps } from "@livekit/components-react";

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
  const { chatMessagesCombined, isSending, send, ulRef } = useChatMessage();
  const { textareaRef, handleKeyDown, handleInput, sendMessage } = useChatTextarea(send);

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
      <form className="flex gap-2 border-t border-gray-800 pt-2" onSubmit={(e) => e.preventDefault()}>
        <textarea
          className="w-full resize-none rounded-md border border-gray-300 px-2 py-1"
          disabled={isSending}
          ref={textareaRef}
          rows={1}
          placeholder="메시지 입력..."
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onKeyUp={(ev) => ev.stopPropagation()}
        />
        <button
          type="submit"
          className="relative inline-flex cursor-pointer items-center justify-center p-0"
          disabled={isSending}
          onClick={sendMessage}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatSidebar;
