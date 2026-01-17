import { useChatStore } from "./chat.store";
import { Participant, RoomEvent } from "livekit-client";

import { useEffect, useMemo } from "react";

import { type ReceivedChatMessage, useChat, useRoomContext } from "@livekit/components-react";

export const useBindChat = () => {
  const room = useRoomContext();
  const { chatMessages } = useChat();

  const roomName = useChatStore((s) => s.roomName);
  const reset = useChatStore((s) => s.reset);
  const addSystemMessage = useChatStore((s) => s.addSystemMessage);
  const setChatMessages = useChatStore((s) => s.setChatMessages);

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
      message: `환영합니다! 채팅에 참여해보세요.\n${room.name || "알 수 없는"} 방에 참가했습니다.`,
      timestamp: Date.now(),
      from: systemFrom,
    };
    addSystemMessage(systemWelcome);
  }, [room.name, roomName, reset, addSystemMessage, systemFrom]);

  useEffect(() => {
    if (!room) return;

    const onConnected = (p: Participant) => {
      addSystemMessage({
        id: `system-join-${room.name}-${p.sid}`,
        message: `${p.name ?? p.identity}가 방에 입장했습니다.`,
        timestamp: Date.now(),
        from: systemFrom,
      });
    };

    const onDisconnected = (p: Participant) => {
      addSystemMessage({
        id: `system-leave-${room.name}-${p.sid}`,
        message: `${p.name ?? p.identity}가 방을 나갔습니다.`,
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
  }, [room, addSystemMessage, systemFrom]);

  useEffect(() => {
    setChatMessages(chatMessages);
  }, [chatMessages, setChatMessages]);

  return null;
};
