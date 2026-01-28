import { useChatMessage } from "../model/use-chat-message";
import { useChatTextarea } from "../model/use-chat-textarea";
import ChatEntry from "./ChatEntry";
import { Send } from "lucide-react";

const ICON_SIZE = 16;

const ChatSidebar = () => {
  const { messages, isSending, send, ulRef } = useChatMessage();
  const { textareaRef, handleKeyDown, handleInput, sendMessage } = useChatTextarea(send);

  return (
    <div className="grid h-full w-full items-end">
      <ul className="scrollbar-hide flex h-full w-full flex-col gap-1 overflow-auto" ref={ulRef}>
        {messages.map((msg, idx, allMsg) => {
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
      <div className="flex gap-2 border-t border-gray-800 pt-2 text-black">
        <textarea
          className="w-full resize-none rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSending}
          ref={textareaRef}
          rows={1}
          placeholder="메시지 입력..."
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onKeyUp={(ev) => ev.stopPropagation()}
        />
        <button
          className="relative inline-flex cursor-pointer items-center justify-center p-0"
          disabled={isSending}
          onClick={sendMessage}
        >
          <Send size={ICON_SIZE} />
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
