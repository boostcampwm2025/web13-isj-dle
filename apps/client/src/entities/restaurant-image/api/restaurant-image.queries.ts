import { updateRestaurantImagesCache } from "../lib/restaurant-image-cache";
import { fetchMyRestaurantImage, fetchRestaurantImagesFeed, fetchUserRestaurantImage } from "./restaurant-image.fetch";
import {
  deleteRestaurantImage,
  likeRestaurantImage,
  replaceRestaurantImage,
  uploadRestaurantImage,
} from "./restaurant-image.mutation";
import { putPresignedRestaurantImage, uploadPresignRestaurantImage } from "./restaurant-image.presign";

import type { RestaurantImageFeedResponse, RestaurantImageResponse } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const restaurantImageKeys = {
  feed: () => ["restaurantImages", "feed"] as const,
  my: (userId: string) => ["restaurantImages", "me", userId] as const,
  user: (targetUserId: string) => ["restaurantImages", "user", targetUserId] as const,
};

export const useRestaurantImagesFeedQuery = (requestUserId: string | null) => {
  return useQuery<RestaurantImageFeedResponse>({
    queryKey: requestUserId ? restaurantImageKeys.feed() : ["restaurantImages", "feed", "anonymous"],
    queryFn: () => {
      if (!requestUserId) throw new Error("requestUserId is required");
      return fetchRestaurantImagesFeed(requestUserId);
    },
    enabled: Boolean(requestUserId),
    staleTime: 30_000,
  });
};

export const useMyRestaurantImagesQuery = (userId: string | null) => {
  return useQuery<RestaurantImageResponse>({
    queryKey: userId ? restaurantImageKeys.my(userId) : ["restaurantImages", "me", "anonymous"],
    queryFn: () => {
      if (!userId) throw new Error("userId is required");
      return fetchMyRestaurantImage(userId);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
};

export const useUserRestaurantImagesQuery = (requestUserId: string | null, targetUserId: string | null) => {
  return useQuery<RestaurantImageResponse>({
    queryKey: targetUserId ? restaurantImageKeys.user(targetUserId) : ["restaurantImages", "user", "none"],
    queryFn: () => {
      if (!requestUserId || !targetUserId) throw new Error("requestUserId and targetUserId are required");
      return fetchUserRestaurantImage(requestUserId, targetUserId);
    },
    enabled: Boolean(requestUserId && targetUserId),
    staleTime: 30_000,
  });
};

export const useUploadRestaurantImageMutation = (userId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error("userId is required");
      return uploadRestaurantImage(userId, file);
    },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: restaurantImageKeys.my(userId) }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: restaurantImageKeys.feed() }).catch(() => undefined);
    },
  });
};

export const useDeleteRestaurantImageMutation = (userId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!userId) throw new Error("userId is required");
      await deleteRestaurantImage(userId, imageUrl);
    },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: restaurantImageKeys.my(userId) }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: restaurantImageKeys.feed() }).catch(() => undefined);
    },
  });
};

export const useReplaceRestaurantImageMutation = (userId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { imageUrl: string; file: File }) => {
      const { imageUrl, file } = params;
      if (!userId) throw new Error("userId is required");

      const presigned = await uploadPresignRestaurantImage(userId, {
        contentType: file.type,
        originalName: file.name,
      });

      await putPresignedRestaurantImage(presigned.uploadUrl, file);
      return replaceRestaurantImage(userId, imageUrl, presigned.imageUrl);
    },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: restaurantImageKeys.my(userId) }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: restaurantImageKeys.feed() }).catch(() => undefined);
    },
  });
};

export const useToggleRestaurantImageLikeMutation = (userId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: string) => {
      if (!userId) throw new Error("userId is required");
      return likeRestaurantImage(userId, imageId);
    },
    onMutate: async (imageId: string) => {
      const previous = queryClient.getQueriesData({ queryKey: ["restaurantImages"] });

      queryClient.setQueriesData({ queryKey: ["restaurantImages"] }, (old) =>
        updateRestaurantImagesCache(old, (img) => {
          if (img.id !== imageId) return img;
          const liked = !img.likedByMe;
          const likes = Math.max(0, img.likes + (liked ? 1 : -1));
          return { ...img, likedByMe: liked, likes };
        }),
      );

      return { previous };
    },
    onError: (_err, _imageId, context) => {
      const previous = context?.previous ?? [];
      for (const [key, data] of previous) {
        queryClient.setQueryData(key, data);
      }
    },
    onSuccess: (res, imageId) => {
      queryClient.setQueriesData({ queryKey: ["restaurantImages"] }, (old) =>
        updateRestaurantImagesCache(old, (img) => {
          if (img.id !== imageId) return img;
          return { ...img, likedByMe: res.liked, likes: res.likes };
        }),
      );
    },
  });
};
