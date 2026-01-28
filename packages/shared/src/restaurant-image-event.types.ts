export enum RestaurantImageEventType {
  THUMBNAIL_UPDATED = "restaurant:image-thumbnail-updated",
  THUMBNAILS_SYNC = "restaurant:image-thumbnails-sync",
  IMAGE_LIKE_TOGGLE = "restaurant:image-like-toggle",
  IMAGE_LIKE_UPDATED = "restaurant:image-like-updated",
}

export type RestaurantThumbnailUpdatedPayload = {
  userId: string;
  thumbnailUrl: string | null;
};

export type RestaurantThumbnailsSyncPayload = {
  userIds: string[];
};

export type RestaurantThumbnailsStatePayload = {
  thumbnailsByUserId: Record<string, string | null>;
};

export type RestaurantImageLikeUpdatedPayload = {
  imageId: string;
  likes: number;
};

export type RestaurantImageLikeTogglePayload = {
  imageId: string;
  userId: string;
};

export type RestaurantImageLikeToggleAck =
  | { success: true; likes: number; liked: boolean }
  | { success: false; message?: string };
