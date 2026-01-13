import ProximityThumbnailList from "./ProximityThumbnailList";

const ProximityThumbnailsWrapper = () => {
  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-40 flex justify-center">
      <div className="pointer-events-auto">
        <ProximityThumbnailList />
      </div>
    </div>
  );
};

export default ProximityThumbnailsWrapper;
