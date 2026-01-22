import { requestLivekitToken } from "../api/livekit.api";

import { useEffect, useMemo, useState } from "react";

import { useBreakoutStore } from "@entities/lectern/breakout.store";
import { useLecternStore } from "@entities/lectern/lectern.store";
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
  const hostId = useLecternStore((state) => state.hostId);
  const isHost = userId === hostId;

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

    setConfig({
      roomId: effectiveRoomId,
      userId,
      nickname,
    });

    setLivekitState((prev) => {
      if (prev.roomId !== effectiveRoomId) {
        return { ...prev, roomId: effectiveRoomId, token: null, serverUrl: null };
      }
      return { ...prev, roomId: effectiveRoomId };
    });

    const isBreakoutRoom = effectiveRoomId.startsWith("breakout-");

    if (currentRoomId === "lobby" || currentRoomId === "desk zone") {
      setLivekitState((prev) => ({ ...prev, isOpen: !!contactId }));
    } else if (currentRoomId.startsWith("meeting (") && currentRoomId.includes("-")) {
      setLivekitState((prev) => ({ ...prev, isOpen: false }));
    } else if (isBreakoutRoom) {
      setLivekitState((prev) => ({ ...prev, isOpen: true }));
    } else {
      setLivekitState((prev) => ({ ...prev, isOpen: true }));
    }
  }, [currentRoomId, userId, nickname, contactId, isHost, breakoutState?.isActive, myBreakoutRoomId]);

  useEffect(() => {
    if (!config) return;
    const controller = new AbortController();

    (async () => {
      setLivekitState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (!livekitState.isOpen) {
          throw new Error("Livekit room is not open");
        }
        const data = await requestLivekitToken(config, controller.signal);

        setLivekitState((prev) => ({ ...prev, token: data.token, serverUrl: data.url, isLoading: false, error: null }));
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("[useLivekit] Token request failed:", error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

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
