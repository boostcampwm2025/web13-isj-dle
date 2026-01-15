import type { ChatEntryProps } from "@livekit/components-react";

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

export default ChatEntry;
