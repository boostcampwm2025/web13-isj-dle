import { useEffect, useMemo, useRef } from "react";

import { restaurantImageKeys, useRestaurantImageStore } from "@entities/restaurant-image";
import { useUserStore } from "@entities/user";
import { emitAck, useWebSocket } from "@features/socket";
import {
  type RestaurantImage,
  RestaurantImageEventType,
  type RestaurantImageFeedResponse,
  type RestaurantImageLikeUpdatedPayload,
  type RestaurantImageResponse,
  type RestaurantThumbnailUpdatedPayload,
  type RestaurantThumbnailsStatePayload,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";

const MAX_SYNC_USERS = 200;

const updateImages = (images: RestaurantImage[], updater: (img: RestaurantImage) => RestaurantImage) => {
  let changed = false;
  const next = images.map((img) => {
    const updated = updater(img);
    if (updated !== img) changed = true;
    return updated;
  });
  return changed ? next : images;
};

const updateRestaurantImagesData = (data: unknown, updater: (img: RestaurantImage) => RestaurantImage): unknown => {
  if (!data || typeof data !== "object") return data;

  if ("images" in data && Array.isArray((data as { images: unknown }).images)) {
    const typed = data as RestaurantImageFeedResponse | RestaurantImageResponse;
    const nextImages = updateImages(typed.images, updater);

    if ("latestImage" in typed) {
      const nextLatest =
        typed.latestImage && typeof typed.latestImage === "object" ? updater(typed.latestImage) : typed.latestImage;
      if (nextImages === typed.images && nextLatest === typed.latestImage) return data;
      return { ...typed, images: nextImages, latestImage: nextLatest } satisfies RestaurantImageResponse;
    }

    if (nextImages === typed.images) return data;
    return { ...typed, images: nextImages } satisfies RestaurantImageFeedResponse;
  }

  return data;
};

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
        updateRestaurantImagesData(old, (img) => {
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
          const nextLatest = { ...state.latestImageIdByUserId };
          const nextImageUrlsById = { ...state.imageUrlsById };

          for (const [userId, url] of Object.entries(map)) {
            const nextUrl = url ?? null;
            const currentId = state.latestImageIdByUserId[userId] ?? null;
            if (currentId === nextUrl) continue;
            changed = true;
            nextLatest[userId] = nextUrl;
            if (nextUrl) nextImageUrlsById[nextUrl] = nextUrl;
          }

          if (!changed) return state;
          return { ...state, latestImageIdByUserId: nextLatest, imageUrlsById: nextImageUrlsById };
        });
      })
      .catch(() => undefined);
  }, [socket, isConnected, restaurantUserIds, restaurantUserIdsKey]);

  return null;
};
