import { requestLivekitToken } from "../../../pages/room/api/livekit.api";

import { useEffect, useMemo, useState } from "react";

import { useBreakoutStore } from "@entities/lectern";
import { useUserStore } from "@entities/user";
import type { LivekitRoomConfig } from "@shared/types";

interface UseLivekitState {
  token: string | null;
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  roomId: string | null;
}

export const useLivekit = (): UseLivekitState => {
  const [config, setConfig] = useState<LivekitRoomConfig | null>(null);
  const currentRoomId = useUserStore((state) => state.user?.avatar.currentRoomId);
  const userId = useUserStore((state) => state.user?.id);
  const nickname = useUserStore((state) => state.user?.nickname);
  const contactId = useUserStore((state) => state.user?.contactId);

  const breakoutState = useBreakoutStore((state) => state.breakoutState);

  const myBreakoutRoomId = useMemo(() => {
    if (!breakoutState?.isActive || !userId) return null;
    return breakoutState.rooms.find((room) => room.userIds.includes(userId))?.roomId ?? null;
  }, [breakoutState, userId]);

  const [livekitState, setLivekitState] = useState<UseLivekitState>({
    token: null,
    serverUrl: null,
    isLoading: false,
    error: null,
    isOpen: false,
    roomId: null,
  });

  useEffect(() => {
    if (!currentRoomId || !userId || !nickname) return;

    const effectiveRoomId = myBreakoutRoomId ? myBreakoutRoomId : getEffectiveRoomId(currentRoomId, contactId);

    setConfig((prev) => {
      if (prev?.roomId === effectiveRoomId && prev?.userId === userId && prev?.nickname === nickname) {
        return prev;
      }
      return {
        roomId: effectiveRoomId,
        userId,
        nickname,
      };
    });

    setLivekitState((prev) => {
      if (prev.roomId === effectiveRoomId) {
        return prev;
      }
      return { ...prev, roomId: effectiveRoomId, token: null, serverUrl: null };
    });

    const isBreakoutRoom = effectiveRoomId.startsWith("breakout-");

    setLivekitState((prev) => {
      let nextIsOpen = false;
      if (currentRoomId === "lobby" || currentRoomId === "desk zone") {
        nextIsOpen = !!contactId;
      } else if (currentRoomId.startsWith("meeting (") && currentRoomId.includes("-")) {
        nextIsOpen = false;
      } else if (isBreakoutRoom) {
        nextIsOpen = true;
      } else {
        nextIsOpen = true;
      }

      if (prev.isOpen === nextIsOpen) return prev;
      return { ...prev, isOpen: nextIsOpen };
    });
  }, [currentRoomId, userId, nickname, contactId, myBreakoutRoomId]);

  useEffect(() => {
    if (!config) return;
    const controller = new AbortController();

    (async () => {
      setLivekitState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (!livekitState.isOpen) return;
        const data = await requestLivekitToken(config, controller.signal);

        setLivekitState((prev) => ({ ...prev, token: data.token, serverUrl: data.url, isLoading: false, error: null }));
      } catch (error) {
        if (controller.signal.aborted) return;

        setLivekitState((prev) => ({
          ...prev,
          token: null,
          serverUrl: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    })();

    return () => controller.abort();
  }, [config, livekitState.isOpen]);

  return livekitState;
};

export const getEffectiveRoomId = (
  roomId: string,
  contactId: string | null | undefined,
  breakoutRoomId?: string | null | undefined,
): string => {
  if (breakoutRoomId) {
    return breakoutRoomId;
  }

  if ((roomId === "lobby" || roomId === "desk zone") && contactId) {
    return contactId;
  }

  return roomId;
};
