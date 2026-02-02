import { useChatMessage } from "../model/use-chat-message";
import { useChatScroll } from "../model/use-chat-scroll";
import { useChatTextarea } from "../model/use-chat-textarea";
import ChatEntry from "./ChatEntry";
import { ChevronDown, Send } from "lucide-react";

const ICON_SIZE = 16;

const ChatSidebar = () => {
  const { messages, isSending, send } = useChatMessage();
  const { ulRef, newChatCount, scrollToBottom, showNewMessageButton } = useChatScroll({ chatLength: messages.length });
  const { textareaRef, handleKeyDown, handleInput, sendMessage } = useChatTextarea(send, scrollToBottom);

  return (
    <div className="grid h-full w-full items-end">
      <ul className="scrollbar-hide flex h-full w-full flex-col gap-1 overflow-auto" ref={ulRef}>
        {messages.map((msg, idx, allMsg) => {
          const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from;
          const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000;

          return (
            <ChatEntry key={msg.id} hideName={hideName} hideTimestamp={!hideName ? false : hideTimestamp} entry={msg} />
          );
        })}
      </ul>

      {showNewMessageButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-14 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-600"
        >
          <ChevronDown className="h-4 w-4" />새 메시지 {newChatCount > 1 && `${newChatCount}개`}
        </button>
      )}
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
          className="relative inline-flex items-center justify-center p-0"
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
