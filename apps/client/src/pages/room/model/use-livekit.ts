import { requestLivekitToken } from "../api/livekit.api";

import { useEffect, useState } from "react";

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
  const user = useUserStore((state) => state.user);
  const users = useUserStore((state) => state.users);
  const [config, setConfig] = useState<LivekitRoomConfig | null>(null);
  const currentRoomId = user?.avatar.currentRoomId;
  const userId = user?.id;
  const nickname = user?.nickname;

  const currentUserFromList = users.find((u) => u.id === userId);
  const contactId = currentUserFromList?.contactId ?? user?.contactId;

  const breakoutState = useBreakoutStore((state) => state.breakoutState);
  const hostId = useLecternStore((state) => state.hostId);
  const isHost = userId === hostId;

  const myBreakoutRoomId =
    breakoutState?.isActive && userId
      ? (breakoutState.rooms.find((room) => room.userIds.includes(userId))?.roomId ?? null)
      : null;

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

    // 호스트/비호스트 관계없이 breakout room에 속해있으면 해당 room으로 연결
    const effectiveRoomId = myBreakoutRoomId ? myBreakoutRoomId : getEffectiveRoomId(currentRoomId, contactId);

    console.log("[useLivekit] effectiveRoomId calculation", {
      isHost,
      myBreakoutRoomId,
      currentRoomId,
      effectiveRoomId,
    });

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

    console.log("[useLivekit] Token request starting", {
      config,
      isOpen: livekitState.isOpen,
    });

    (async () => {
      setLivekitState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (!livekitState.isOpen) {
          console.log("[useLivekit] Token request blocked - room not open");
          throw new Error("Livekit room is not open");
        }

        console.log("[useLivekit] Requesting token for room:", config.roomId);
        const data = await requestLivekitToken(config, controller.signal);
        console.log("[useLivekit] Token received successfully");

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
