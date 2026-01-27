import { useEffect, useMemo, useRef } from "react";

import { restaurantImageKeys, useRestaurantImageStore } from "@entities/restaurant-image";
import { useUserStore } from "@entities/user";
import { emitAck, useWebSocket } from "@features/socket";
import {
  RestaurantImageEventType,
  type RestaurantThumbnailUpdatedPayload,
  type RestaurantThumbnailsStatePayload,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";

const MAX_SYNC_USERS = 200;

export const useSyncImage = () => {
  const { socket, isConnected } = useWebSocket();
  const users = useUserStore((s) => s.users);
  const me = useUserStore((s) => s.user);
  const queryClient = useQueryClient();

  const restaurantUserIds = useMemo(() => {
    const ids = new Set<string>();
    if (me?.avatar.currentRoomId === "restaurant") ids.add(me.id);
    for (const u of users) {
      if (u.avatar.currentRoomId === "restaurant") ids.add(u.id);
    }
    return Array.from(ids).slice(0, MAX_SYNC_USERS);
  }, [me, users]);

  const restaurantUserIdsKey = useMemo(
    () =>
      restaurantUserIds
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .join(","),
    [restaurantUserIds],
  );
  const lastSyncKeyRef = useRef<string>("");

  useEffect(() => {
    if (!socket) return;

    const handleThumbnailUpdated = (payload: RestaurantThumbnailUpdatedPayload) => {
      const userId = String(payload?.userId ?? "").trim();
      if (!userId) return;

      const thumbnailUrl = payload.thumbnailUrl ?? null;
      const current = useRestaurantImageStore.getState().getThumbnailUrlByUserId(userId);
      if (current === thumbnailUrl) return;

      if (thumbnailUrl) {
        useRestaurantImageStore.getState().setThumbnail(userId, thumbnailUrl);
      } else {
        useRestaurantImageStore.getState().clearThumbnail(userId);
      }

      queryClient.invalidateQueries({ queryKey: restaurantImageKeys.feed() }).catch(() => undefined);
      if (me?.id && userId === me.id) {
        queryClient.invalidateQueries({ queryKey: restaurantImageKeys.my(me.id) }).catch(() => undefined);
      }
    };

    socket.on(RestaurantImageEventType.THUMBNAIL_UPDATED, handleThumbnailUpdated);
    return () => {
      socket.off(RestaurantImageEventType.THUMBNAIL_UPDATED, handleThumbnailUpdated);
    };
  }, [socket, queryClient, me?.id]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    if (!restaurantUserIdsKey) return;
    if (lastSyncKeyRef.current === restaurantUserIdsKey) return;
    lastSyncKeyRef.current = restaurantUserIdsKey;

    emitAck<RestaurantThumbnailsStatePayload>(socket, RestaurantImageEventType.THUMBNAILS_SYNC, {
      userIds: restaurantUserIds,
    })
      .then((res) => {
        const map = res?.thumbnailsByUserId ?? {};
        useRestaurantImageStore.setState((state) => {
          let changed = false;
          const nextLatest = { ...state.latestImageIdByUserId };
          const nextImagesById = { ...state.imagesById };

          for (const [userId, url] of Object.entries(map)) {
            const nextUrl = url ?? null;
            const currentId = state.latestImageIdByUserId[userId] ?? null;
            if (currentId === nextUrl) continue;
            changed = true;
            nextLatest[userId] = nextUrl;
            if (nextUrl) nextImagesById[nextUrl] = { id: nextUrl, userId, url: nextUrl };
          }

          if (!changed) return state;
          return { ...state, latestImageIdByUserId: nextLatest, imagesById: nextImagesById };
        });
      })
      .catch(() => undefined);
  }, [socket, isConnected, restaurantUserIds, restaurantUserIdsKey]);

  return null;
};
