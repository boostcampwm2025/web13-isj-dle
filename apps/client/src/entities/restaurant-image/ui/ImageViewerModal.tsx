import { useRestaurantImageViewStore } from "../model/restaurant-image-view.store";
import ImageViewerModalContent from "./ImageViewerModalContent";

const ImageViewerModal = () => {
  const { imageUrl, isOpen, closeViewer } = useRestaurantImageViewStore();

  if (!isOpen || !imageUrl) {
    return null;
  }

  return <ImageViewerModalContent imageUrl={imageUrl} onClose={closeViewer} />;
};

export default ImageViewerModal;
