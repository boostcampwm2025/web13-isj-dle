import RoomContent from "./RoomContent";
import RoomInfo from "./RoomInfo";

const VideoRoom = () => {
  return (
    <div className="fixed inset-0 z-5 bg-black/50">
      <div className="absolute top-20 left-4 z-10 flex gap-2">
        <RoomInfo />
      </div>
      <RoomContent />
    </div>
  );
};

export default VideoRoom;
