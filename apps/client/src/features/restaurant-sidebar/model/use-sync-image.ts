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
  const userId = useUserStore((s) => s.user?.userId);
  const currentRoomId = useUserStore((s) => s.user?.avatar.currentRoomId);
  const queryClient = useQueryClient();

  const restaurantUserIds = useMemo(() => {
    const userIds = new Set<number>();
    if (currentRoomId === "restaurant" && userId) userIds.add(userId);
    for (const u of users) {
      if (u.avatar.currentRoomId === "restaurant") userIds.add(u.userId);
    }
    return Array.from(userIds).slice(0, MAX_SYNC_USERS);
  }, [currentRoomId, userId, users]);

  const restaurantUserIdsKey = useMemo(
    () =>
      restaurantUserIds
        .slice()
        .sort((a, b) => a - b)
        .join(","),
    [restaurantUserIds],
  );
  const lastSyncKeyRef = useRef<string>("");

  useEffect(() => {
    if (!socket) return;

    const handleThumbnailUpdated = (payload: RestaurantThumbnailUpdatedPayload) => {
      const payloadUserId = payload?.userId;
      if (!payloadUserId) return;

      const thumbnailUrl = payload.thumbnailUrl ?? null;
      const current = useRestaurantImageStore.getState().getThumbnailUrlByUserId(payloadUserId);
      if (current === thumbnailUrl) return;

      if (thumbnailUrl) {
        useRestaurantImageStore.getState().setThumbnail(payloadUserId, thumbnailUrl);
      } else {
        useRestaurantImageStore.getState().clearThumbnail(payloadUserId);
      }

      queryClient.invalidateQueries({ queryKey: restaurantImageKeys.feed() }).catch(() => undefined);
      if (userId && payloadUserId === userId) {
        queryClient.invalidateQueries({ queryKey: restaurantImageKeys.my(userId) }).catch(() => undefined);
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
  }, [socket, queryClient, userId]);

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
            if (state.thumbnailUrlByUserId[Number(userId)] === nextUrl) continue;
            changed = true;
            next[Number(userId)] = nextUrl;
          }

          if (!changed) return state;
          return { ...state, thumbnailUrlByUserId: next };
        });
      })
      .catch(() => undefined);
  }, [socket, isConnected, restaurantUserIds, restaurantUserIdsKey]);

  return null;
};
