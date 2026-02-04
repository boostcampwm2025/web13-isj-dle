export enum RestaurantImageEventType {
  THUMBNAIL_UPDATED = "restaurant:image-thumbnail-updated",
  THUMBNAILS_SYNC = "restaurant:image-thumbnails-sync",
  IMAGE_LIKE_TOGGLE = "restaurant:image-like-toggle",
  IMAGE_LIKE_UPDATED = "restaurant:image-like-updated",
}

export type RestaurantThumbnailUpdatedPayload = {
  userId: number;
  thumbnailUrl: string | null;
};

export type RestaurantThumbnailsSyncPayload = {
  userIds: number[];
};

export type RestaurantThumbnailsStatePayload = {
  thumbnailsByUserId: Record<number, string | null>;
};

export type RestaurantImageLikeUpdatedPayload = {
  imageId: string;
  likes: number;
};

export type RestaurantImageLikeTogglePayload = {
  imageId: string;
  userId: number;
};

export type RestaurantImageLikeToggleAck =
  | { success: true; likes: number; liked: boolean }
  | { success: false; message?: string };
