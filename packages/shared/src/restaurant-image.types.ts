export type RestaurantImage = {
  id: string;
  url: string;
  userId: string;
  nickname: string;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
};

export type RestaurantImageResponse = {
  latestImage: RestaurantImage | null;
  images: RestaurantImage[];
};

export type RestaurantImageFeedResponse = {
  images: RestaurantImage[];
};
