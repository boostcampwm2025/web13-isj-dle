import ImageUploadButton from "./ImageUploadButton";

const RestaurantSidebar = () => {
  return (
    <div className="scrollbar-hide flex h-full w-full flex-col gap-4 overflow-y-auto">
      <ImageUploadButton />
    </div>
  );
};

export default RestaurantSidebar;
