import { AVATAR_ASSETS } from "../model/avatar-asset";

type ImageLoader = {
  load: {
    image: (key: string, url: string) => void;
  };
};

function preloadAvatar(imageLoader: ImageLoader) {
  Object.values(AVATAR_ASSETS).forEach(({ key, url }) => {
    imageLoader.load.image(key, url);
  });
}

export { preloadAvatar };
