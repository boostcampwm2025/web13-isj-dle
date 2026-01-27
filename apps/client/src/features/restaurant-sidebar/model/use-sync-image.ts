import { useEffect, useMemo, useRef } from "react";

import { restaurantImageKeys, updateRestaurantImagesCache, useRestaurantImageStore } from "@entities/restaurant-image";
import { useUserStore } from "@entities/user";
import { emitAck, useWebSocket } from "@features/socket";
import {
  RestaurantImageEventType,
  type RestaurantImageLikeUpdatedPayload,
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

    const handleLikeUpdated = (payload: RestaurantImageLikeUpdatedPayload) => {
      const imageId = String(payload?.imageId ?? "").trim();
      if (!imageId) return;

      const likes = typeof payload?.likes === "number" ? payload.likes : Number(payload?.likes);
      if (!Number.isFinite(likes)) return;

      queryClient.setQueriesData({ queryKey: ["restaurantImages"] }, (old) =>
        updateRestaurantImagesCache(old, (img) => {
          if (img.id !== imageId) return img;
          return img.likes === likes ? img : { ...img, likes };
        }),
      );
    };

    socket.on(RestaurantImageEventType.THUMBNAIL_UPDATED, handleThumbnailUpdated);
    socket.on(RestaurantImageEventType.IMAGE_LIKE_UPDATED, handleLikeUpdated);
    return () => {
      socket.off(RestaurantImageEventType.THUMBNAIL_UPDATED, handleThumbnailUpdated);
      socket.off(RestaurantImageEventType.IMAGE_LIKE_UPDATED, handleLikeUpdated);
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
          const next = { ...state.thumbnailUrlByUserId };

          for (const [userId, url] of Object.entries(map)) {
            const nextUrl = url ?? null;
            if (state.thumbnailUrlByUserId[userId] === nextUrl) continue;
            changed = true;
            next[userId] = nextUrl;
          }

          if (!changed) return state;
          return { ...state, thumbnailUrlByUserId: next };
        });
      })
      .catch(() => undefined);
  }, [socket, isConnected, restaurantUserIds, restaurantUserIdsKey]);

  return null;
};
