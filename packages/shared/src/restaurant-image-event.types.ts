export enum RestaurantImageEventType {
  THUMBNAIL_UPDATED = "restaurant:image-thumbnail-updated",
  THUMBNAILS_SYNC = "restaurant:image-thumbnails-sync",
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
