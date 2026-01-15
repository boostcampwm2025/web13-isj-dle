import { Participant, RoomEvent } from "livekit-client";

import { useEffect, useRef, useState } from "react";

import { type ReceivedChatMessage, useChat, useRoomContext } from "@livekit/components-react";

export const useChatMessage = () => {
  const ulRef = useRef<HTMLUListElement>(null);
  const room = useRoomContext();
  const { chatMessages, send, isSending } = useChat();
  const [initialMessage, setInitialMessage] = useState<ReceivedChatMessage[]>([]);
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

  return { chatMessagesCombined, isSending, send, ulRef };
};
