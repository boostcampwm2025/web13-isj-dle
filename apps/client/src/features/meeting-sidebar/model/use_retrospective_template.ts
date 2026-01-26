import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useUserStore } from "@entities/user";
import { useWebSocket } from "@features/socket";
import { MeetingEventType, type RandomRetrospectiveTemplateResponse, type RetrospectiveTemplate } from "@shared/types";

export const useRetrospectiveTemplate = () => {
  const [template, setTemplate] = useState<RetrospectiveTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useWebSocket();
  const roomId = useUserStore((state) => state.user?.avatar.currentRoomId);

  const handleTemplate = async () => {
    setError(null);
    setTemplate(null);
    try {
      if (!socket) throw new Error("Socket is not connected");
      if (!roomId) throw new Error("User is not in a room");
      socket.emit(MeetingEventType.RETROSPECTIVE_TEMPLATE_UPDATE, { roomId: roomId });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  const resetTemplate = () => {
    setTemplate(null);
    setError(null);
  };

  const handleCopy = () => {
    if (template) {
      navigator.clipboard.writeText(template.content.trim());
      toast("템플릿 내용이 복사되었습니다!", { icon: "📋" });
    }
  };

  useEffect(() => {
    if (!isConnected || !socket) return;

    const handleRetrospectiveSync = (data: RandomRetrospectiveTemplateResponse) => {
      setTemplate(data.template);
    };

    socket.on(MeetingEventType.RETROSPECTIVE_TEMPLATE_SYNC, handleRetrospectiveSync);
    return () => {
      socket.off(MeetingEventType.RETROSPECTIVE_TEMPLATE_SYNC, handleRetrospectiveSync);
    };
  }, [isConnected, socket]);

  return { handleTemplate, template, error, resetTemplate, handleCopy };
};
