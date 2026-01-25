export type RestaurantImage = {
  id: string;
  url: string;
  userId: string;
  nickname: string;
  createdAt: string;
};

export type RestaurantImageResponse = {
  latestImage: RestaurantImage | null;
  images: RestaurantImage[];
};
