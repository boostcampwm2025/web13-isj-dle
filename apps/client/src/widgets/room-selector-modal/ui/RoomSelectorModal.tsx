import { getRoomNumbers } from "@shared/config";
import type { RoomType } from "@shared/types";

interface RoomSelectorModalProps {
  isOpen: boolean;
  roomRange: string;
  onSelect: (roomId: RoomType) => void;
  onClose: () => void;
}

export const RoomSelectorModal = ({ isOpen, roomRange, onSelect, onClose }: RoomSelectorModalProps) => {
  const rooms = isOpen && roomRange ? getRoomNumbers(roomRange) : [];

  if (!isOpen) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-10000 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative max-h-[80vh] w-[90%] max-w-125 overflow-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-2xl leading-none text-gray-600 transition-colors duration-200"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          aria-label="닫기"
        >
          ×
        </button>

        <div className="mb-4">
          <h2 className="mb-2 text-xl font-semibold">회의실 선택</h2>
          <p className="text-sm text-gray-600">입장할 회의실을 선택하세요</p>
        </div>

        <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {rooms.map((room) => (
            <button
              key={room}
              onClick={() => onSelect(room as RoomType)}
              className="cursor-pointer rounded-md border-2 border-transparent bg-gray-100 px-4 py-3 text-sm font-medium transition-all duration-200"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              {room.replace("meeting (", "").replace(")", "")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
