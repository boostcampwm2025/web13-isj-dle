import { JOIN_SUFFIX, LEAVE_SUFFIX } from "./chat.constants";
import { useChatStore } from "./chat.store";
import { Participant, RoomEvent } from "livekit-client";

import { useEffect, useMemo, useRef } from "react";

import { type ReceivedChatMessage, useChat, useRoomContext } from "@livekit/components-react";
import { useSidebarStore } from "@widgets/sidebar";

export const useBindChat = (initialRoomName: string, contactId: string | null) => {
  const room = useRoomContext();
  const { chatMessages } = useChat();

  const roomName = useChatStore((s) => s.roomName);
  const reset = useChatStore((s) => s.reset);
  const addSystemMessage = useChatStore((s) => s.addSystemMessage);
  const setChatMessages = useChatStore((s) => s.setChatMessages);
  const incrementUnreadCount = useChatStore((s) => s.incrementUnreadCount);

  const isOpen = useSidebarStore((s) => s.isOpen);
  const currentKey = useSidebarStore((s) => s.currentKey);
  const isChatOpen = isOpen && currentKey === "chat";

  const prevMessageCountRef = useRef(0);

  const systemFrom = useMemo(
    () =>
      ({
        name: "System",
        identity: "System",
        isLocal: false,
      }) as Participant,
    [],
  );

  useEffect(() => {
    if (!room.name || roomName === room.name) return;

    reset(room.name);

    const systemWelcome: ReceivedChatMessage = {
      id: `system-welcome-${room.name ?? "unknown"}`,
      message: JSON.stringify({
        text: `환영합니다! 채팅에 참여해보세요.\n${initialRoomName ? `${initialRoomName} 방에 참가했습니다.` : ""}`,
        contactId,
      }),
      timestamp: Date.now(),
      from: systemFrom,
    };
    addSystemMessage(systemWelcome);
  }, [room.name, roomName, reset, addSystemMessage, systemFrom, initialRoomName, contactId]);

  useEffect(() => {
    if (!room) return;

    const onConnected = (p: Participant) => {
      addSystemMessage({
        id: `system-join-${room.name}-${p.sid}`,
        message: JSON.stringify({
          text: `${p.name ?? p.identity}${JOIN_SUFFIX}`,
          contactId,
        }),
        timestamp: Date.now(),
        from: systemFrom,
      });
    };

    const onDisconnected = (p: Participant) => {
      addSystemMessage({
        id: `system-leave-${room.name}-${p.sid}`,
        message: JSON.stringify({
          text: `${p.name ?? p.identity}${LEAVE_SUFFIX}`,
          contactId,
        }),
        timestamp: Date.now(),
        from: systemFrom,
      });
    };

    room.on(RoomEvent.ParticipantConnected, onConnected);
    room.on(RoomEvent.ParticipantDisconnected, onDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onConnected);
      room.off(RoomEvent.ParticipantDisconnected, onDisconnected);
    };
  }, [room, addSystemMessage, systemFrom, contactId]);

  useEffect(() => {
    setChatMessages(chatMessages);

    const newMessageCount = chatMessages.length - prevMessageCountRef.current;
    if (newMessageCount > 0 && !isChatOpen) {
      for (let i = 0; i < newMessageCount; i++) {
        const msg = chatMessages[prevMessageCountRef.current + i];
        if (msg && !msg.from?.isLocal) {
          incrementUnreadCount();
        }
      }
    }
    prevMessageCountRef.current = chatMessages.length;
  }, [chatMessages, setChatMessages, isChatOpen, incrementUnreadCount]);

  return null;
};
